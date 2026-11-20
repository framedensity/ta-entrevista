"""Builds content/tools/<id>.js from a folder of tool sources plus hand-written notes.

    python3 tools_build/build.py <folder with the tool sources> [tool_id ...]

What it does, per tool (notes/<id>.py):
  * reads every file listed in TOOL['files'] and removes personal names (ANON)
  * parses it with ast: every class / function with its line range and docstring
  * builds the call graph: which functions each function calls or connects to,
    and the reverse ("called by"), across the files of the same tool
  * attaches the notes (NOTES per function, LINES per line, FILES per file)
  * reports functions without a note, notes that point at nothing, and every
    external API name that has no glossary entry
"""
import ast
import builtins
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT = os.path.join(SITE, 'content', 'tools')

# Personal names never reach the site. The patterns live in anon_local.py (not committed):
#   ANON = [(compiled regex, replacement), ...]   FORBIDDEN = compiled regex
try:
    from anon_local import ANON, FORBIDDEN
except ImportError:
    ANON, FORBIDDEN = [], re.compile(r'/Users/|C:\\Users\\')

# Import aliases are normalized so the glossary has one key per API.
CANON_PREFIX = [('PySide2.', ''), ('PySide6.', ''), ('shiboken2.', 'shiboken.'), ('shiboken6.', 'shiboken.')]


def load_module(path):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def anonymize(text):
    for rx, rep in ANON:
        text = rx.sub(rep, text)
    return text


def canon(name):
    for a, b in CANON_PREFIX:
        if name.startswith(a):
            return b + name[len(a):]
    return name


class FileInfo(object):
    def __init__(self, rel, code, pkg_files):
        self.rel = rel
        self.code = code
        self.lines = code.split('\n')
        self.lang = 'md' if rel.endswith('.md') else 'py'
        self.tree = ast.parse(code) if self.lang == 'py' else ast.parse('')
        self.defs = []          # dicts: q, k, s, e, doc
        self.by_q = {}
        self.imports = {}       # local alias -> ('file', rel) | ('def', rel, qualname) | ('ext', dotted)
        self.pkg_files = pkg_files
        self._collect_imports()
        self._collect_defs(self.tree, [], None)

    # ---------- imports ----------
    def _resolve_rel(self, level, module):
        base = os.path.dirname(self.rel)
        for _ in range(level - 1):
            base = os.path.dirname(base)
        parts = [p for p in (module or '').split('.') if p]
        return os.path.normpath(os.path.join(base, *parts)) if parts else base

    def _module_file(self, path_no_ext):
        for cand in (path_no_ext + '.py', os.path.join(path_no_ext, '__init__.py')):
            cand = os.path.normpath(cand)
            if cand in self.pkg_files:
                return cand
        return None

    def _abs_module_file(self, dotted):
        return self._module_file(dotted.replace('.', '/'))

    def _collect_imports(self):
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Import):
                for a in node.names:
                    alias = a.asname or a.name.split('.')[0]
                    target = a.name if a.asname else a.name.split('.')[0]
                    f = self._abs_module_file(a.name)
                    self.imports[alias] = ('file', f) if f and a.asname else ('ext', canon(target))
            elif isinstance(node, ast.ImportFrom):
                if node.level:
                    base = self._resolve_rel(node.level, node.module)
                else:
                    base = None
                    f = self._abs_module_file(node.module or '')
                    if f:
                        base = os.path.splitext(f)[0]
                        if base.endswith('__init__'):
                            base = os.path.dirname(base)
                for a in node.names:
                    alias = a.asname or a.name
                    if base is not None:
                        sub = self._module_file(os.path.join(base, a.name))
                        if sub:
                            self.imports[alias] = ('file', sub)
                        else:
                            mf = self._module_file(base)
                            self.imports[alias] = ('def', mf, a.name) if mf else ('ext', a.name)
                    else:
                        self.imports[alias] = ('ext', canon((node.module or '') + '.' + a.name))

        # local aliases such as  W = QtWidgets
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Name) and len(node.targets) == 1 \
                    and isinstance(node.targets[0], ast.Name):
                imp = self.imports.get(node.value.id)
                if imp and imp[0] == 'ext' and node.targets[0].id not in self.imports:
                    self.imports[node.targets[0].id] = imp

    # ---------- defs ----------
    def _collect_defs(self, node, stack, cls):
        for child in ast.iter_child_nodes(node):
            if not isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                self._collect_defs(child, stack, cls)   # defs inside if/for/try blocks
                continue
            if True:
                q = '.'.join(stack + [child.name])
                start = min([child.lineno] + [d.lineno for d in child.decorator_list])
                doc = ast.get_docstring(child) or ''
                d = {'q': q, 'k': 'class' if isinstance(child, ast.ClassDef) else 'def',
                     's': start, 'e': child.end_lineno, 'doc': doc.split('\n\n')[0].strip(),
                     'node': child, 'cls': child.name if isinstance(child, ast.ClassDef) else cls,
                     'bases': [b.id for b in child.bases if isinstance(b, ast.Name)] if isinstance(child, ast.ClassDef) else []}
                self.defs.append(d)
                self.by_q[q] = d
                self._collect_defs(child, stack + [child.name], d['cls'])

    def class_method(self, cls, name, files, seen=None):
        """Find cls.name, following base classes defined in the same tool."""
        seen = seen or set()
        if cls in seen:
            return None
        seen.add(cls)
        q = cls + '.' + name
        if q in self.by_q:
            return (self.rel, q)
        cdef = self.by_q.get(cls)
        for b in (cdef or {}).get('bases', []):
            tgt = self.resolve_name(b, [], files)
            if tgt:
                f = files[tgt[0]]
                r = f.class_method(tgt[1], name, files, seen)
                if r:
                    return r
        return None

    def resolve_name(self, name, scope, files):
        # nested function in an enclosing scope, then module level, then imports
        for i in range(len(scope), -1, -1):
            q = '.'.join(scope[:i] + [name])
            if q in self.by_q and self.by_q[q]['k'] in ('def', 'class'):
                return (self.rel, q)
        imp = self.imports.get(name)
        if imp and imp[0] == 'def' and imp[1] in files and imp[2] in files[imp[1]].by_q:
            return (imp[1], imp[2])
        return None


def gather_calls(fi, d, files):
    """Functions this definition calls or references (signals, callbacks)."""
    out = []
    scope = d['q'].split('.')
    node = d['node']
    body_nodes = []
    for child in ast.iter_child_nodes(node):
        if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            continue   # nested defs report their own calls
        body_nodes.append(child)

    def walk_own(n):
        # like ast.walk, but does not enter nested defs (they report their own calls)
        todo = [n]
        while todo:
            cur = todo.pop()
            yield cur
            for ch in ast.iter_child_nodes(cur):
                if not isinstance(ch, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)) or isinstance(ch, ast.Lambda):
                    todo.append(ch)

    def visit(n):
        for sub in walk_own(n):
            tgt = None
            if isinstance(sub, ast.Name) and isinstance(sub.ctx, ast.Load) and sub.id not in ('self', 'cls'):
                tgt = fi.resolve_name(sub.id, scope, files)
            elif isinstance(sub, ast.Attribute) and isinstance(sub.value, ast.Name):
                base = sub.value.id
                if base in ('self', 'cls') and d['cls']:
                    tgt = fi.class_method(d['cls'], sub.attr, files)
                else:
                    imp = fi.imports.get(base)
                    if imp and imp[0] == 'file' and imp[1] in files and sub.attr in files[imp[1]].by_q:
                        tgt = (imp[1], sub.attr)
                    else:
                        r = fi.resolve_name(base, scope, files)
                        if r and files[r[0]].by_q[r[1]]['k'] == 'class':
                            tgt = files[r[0]].class_method(r[1], sub.attr, files)
            if tgt and tgt != (fi.rel, d['q']) and tgt not in out:
                out.append(tgt)
    for b in body_nodes:
        if isinstance(b, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            continue
        visit(b)
    return out


def external_names(fi):
    """Dotted external API names used in a file, canonicalized: maya.cmds.keyframe."""
    names = set()
    for sub in ast.walk(fi.tree):
        if isinstance(sub, ast.Attribute):
            chain = []
            n = sub
            while isinstance(n, ast.Attribute):
                chain.append(n.attr)
                n = n.value
            if isinstance(n, ast.Name):
                imp = fi.imports.get(n.id)
                if imp and imp[0] == 'ext' and not imp[1].startswith('__future__'):
                    chain.reverse()
                    names.add(canon(imp[1] + '.' + chain[0]))
                    if canon(imp[1] + '.' + chain[0]) == 'os.path' and len(chain) > 1:
                        names.add('os.path.' + chain[1])
        elif isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name):
            nm = sub.func.id
            imp = fi.imports.get(nm)
            if imp and imp[0] == 'ext':
                names.add(canon(imp[1]))
            elif hasattr(builtins, nm) and not fi.resolve_name(nm, [], {fi.rel: fi}):
                names.add('builtins.' + nm)
    return names


def method_names(fi):
    """Attribute calls on objects that are not modules or self: obj.method(...)."""
    out = set()
    for sub in ast.walk(fi.tree):
        if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Attribute):
            v = sub.func.value
            while isinstance(v, ast.Attribute):
                v = v.value
            if isinstance(v, ast.Name) and v.id in fi.imports:
                continue
            if isinstance(sub.func.value, ast.Name) and sub.func.value.id in ('self', 'cls'):
                continue
            out.add('method.' + sub.func.attr)
    return out


def build(src, tool_id, glossary_keys):
    notes = load_module(os.path.join(HERE, 'notes', tool_id + '.py'))
    T = notes.TOOL
    rels = [os.path.normpath(r) for r in T['files']]
    files = {}
    for rel in rels:
        with open(os.path.join(src, rel), encoding='utf-8') as fh:
            code = anonymize(fh.read()).rstrip('\n')
        files[rel] = FileInfo(rel, code, set(rels))
    problems = []
    for rel, fi in files.items():
        for d in fi.defs:
            d['calls'] = gather_calls(fi, d, files)
    by = {}
    for rel, fi in files.items():
        for d in fi.defs:
            for t in d['calls']:
                by.setdefault(t, []).append((rel, d['q']))
    fidx = {rel: i for i, rel in enumerate(rels)}
    out_files = []
    used_ext = set()
    NOTES = getattr(notes, 'NOTES', {})
    LINES = getattr(notes, 'LINES', {})
    FILES = getattr(notes, 'FILES', {})
    SKIP_NOTE = re.compile(getattr(notes, 'SKIP_NOTE', r'^$'))
    for rel in rels:
        fi = files[rel]
        fnotes = NOTES.get(rel, {})
        for q in fnotes:
            if q not in fi.by_q:
                problems.append('note for missing def %s :: %s' % (rel, q))
        line_notes = {}
        for item in LINES.get(rel, []):
            snippet, note = item[0], item[1]
            nth = item[2] if len(item) > 2 else 1
            hits = [i + 1 for i, l in enumerate(fi.lines) if snippet in l]
            if len(hits) < nth:
                problems.append('line snippet not found %s :: %r' % (rel, snippet))
                continue
            ln = hits[nth - 1]
            line_notes[ln] = (line_notes[ln] + '\n\n' if ln in line_notes else '') + note
        outline = []
        for d in fi.defs:
            n = fnotes.get(d['q'], '')
            if not n and not SKIP_NOTE.search(rel):
                problems.append('no note %s :: %s' % (rel, d['q']))
            outline.append({
                'q': d['q'], 'k': d['k'], 's': d['s'], 'e': d['e'], 'doc': d['doc'], 'n': n,
                'c': [[fidx[r], q] for r, q in d['calls']],
                'b': [[fidx[r], q] for r, q in by.get((rel, d['q']), [])],
            })
        ext = external_names(fi) | method_names(fi)
        used_ext |= ext
        aliases = {k: v[1] for k, v in fi.imports.items() if v[0] == 'ext'}
        out_files.append({'path': rel, 'lang': fi.lang, 'note': FILES.get(rel, ''), 'code': fi.code,
                          'aliases': aliases, 'outline': outline,
                          'lines': {str(k): v for k, v in sorted(line_notes.items())}})
    for k in FILES:
        if os.path.normpath(k) not in files:
            problems.append('file note for unknown file %s' % k)
    data = {k: T[k] for k in T if k != 'files'}
    data['files'] = out_files
    text = json.dumps(data, ensure_ascii=False, indent=0)
    leak = FORBIDDEN.search(text)
    if leak:
        raise SystemExit('PERSONAL NAME LEFT in %s: %r' % (tool_id, text[max(0, leak.start() - 40):leak.end() + 40]))
    with open(os.path.join(OUT, tool_id + '.js'), 'w', encoding='utf-8') as fh:
        fh.write('TOOLS.add(' + text + ');\n')
    own = set()
    for f in files.values():
        own |= set('method.' + d['q'].split('.')[-1] for d in f.defs)
    missing = sorted(n for n in used_ext if n not in glossary_keys and not n.startswith('builtins.__') and n not in own)
    return problems, missing, sum(len(f.lines) for f in files.values())


def main():
    src = sys.argv[1]
    only = sys.argv[2:]
    os.makedirs(OUT, exist_ok=True)
    gl = load_module(os.path.join(HERE, 'glossary.py'))
    gkeys = set(gl.GLOSSARY)
    with open(os.path.join(OUT, 'glossary.js'), 'w', encoding='utf-8') as fh:
        fh.write('TOOLS.glossary = ' + json.dumps(gl.GLOSSARY, ensure_ascii=False, indent=0) + ';\n'
                 'TOOLS.syntax = ' + json.dumps(gl.SYNTAX, ensure_ascii=False, indent=0) + ';\n')
    ids = [f[:-3] for f in sorted(os.listdir(os.path.join(HERE, 'notes'))) if f.endswith('.py') and not f.startswith('_')]
    index = []
    all_missing = set()
    for tid in ids:
        notes = load_module(os.path.join(HERE, 'notes', tid + '.py'))
        index.append({k: notes.TOOL[k] for k in ('id', 'title', 'tagline', 'order') if k in notes.TOOL})
        if only and tid not in only:
            continue
        problems, missing, nlines = build(src, tid, gkeys)
        all_missing |= set(missing)
        print('%-22s %5d lines  %3d problems' % (tid, nlines, len(problems)))
        for p in problems:
            print('   ', p)
    index.sort(key=lambda t: t.get('order', 99))
    with open(os.path.join(OUT, 'index.js'), 'w', encoding='utf-8') as fh:
        fh.write('TOOLS.list = ' + json.dumps(index, ensure_ascii=False, indent=0) + ';\n')
    if all_missing:
        print('glossary missing (%d):' % len(all_missing))
        print('   ' + ', '.join(sorted(all_missing)))


if __name__ == '__main__':
    main()
