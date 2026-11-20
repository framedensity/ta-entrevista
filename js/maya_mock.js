// Simulador sencillo de maya.cmds (solo lo necesario para los ejercicios).
// Imita algunas "trampas" reales de Maya: listRelatives devuelve None si no hay nada,
// la escena nueva trae las cámaras persp/top/front/side, los nombres repetidos reciben un número.
window.TA_MAYA_MOCK = String.raw`
import re as _re
import fnmatch as _fn

_SHORT = {'tx': 'translateX', 'ty': 'translateY', 'tz': 'translateZ',
          'rx': 'rotateX', 'ry': 'rotateY', 'rz': 'rotateZ',
          'sx': 'scaleX', 'sy': 'scaleY', 'sz': 'scaleZ', 'v': 'visibility',
          't': 'translate', 'r': 'rotate', 's': 'scale'}
_XFORM = ('transform', 'joint')
_SHAPES = ('locator', 'mesh', 'camera', 'nurbsCurve')
_DAG = _XFORM + _SHAPES


class _Node(object):
    def __init__(self, name, ntype, parent=None):
        self.name = name
        self.type = ntype
        self.parent = parent
        self.children = []
        self.attrs = {}
        self.user = []
        self.keys = {}
        if ntype in _XFORM:
            for a in ('translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ'):
                self.attrs[a] = 0.0
            for a in ('scaleX', 'scaleY', 'scaleZ'):
                self.attrs[a] = 1.0
            self.attrs['visibility'] = True
        if ntype == 'camera':
            self.attrs['focalLength'] = 35.0
        if ntype == 'joint':
            self.attrs['radius'] = 1.0


_nodes = {}
_order = []
_sel = []
_conns = []
_state = {'time': 1.0, 'min': 1.0, 'max': 120.0}
_undo_log = []


def _defaults():
    for cam in ('persp', 'top', 'front', 'side'):
        t = _add(cam, 'transform')
        _add(cam + 'Shape', 'camera', t)


def _reset():
    _nodes.clear()
    del _order[:]
    del _sel[:]
    del _conns[:]
    del _undo_log[:]
    _state.update({'time': 1.0, 'min': 1.0, 'max': 120.0})
    _defaults()


def _flatten(args):
    out = []
    for a in args:
        if isinstance(a, (list, tuple)):
            out.extend(_flatten(a))
        elif a is not None:
            out.append(a)
    return out


def _strip(n):
    return str(n).split('|')[-1]


def _get(n):
    k = _strip(n)
    if k not in _nodes:
        raise ValueError('No object matches name: %s' % n)
    return _nodes[k]


def _unique(base):
    if base not in _nodes:
        return base
    m = _re.match(r'^(.*?)(\d*)$', base)
    stem = m.group(1)
    i = int(m.group(2) or 0) + 1
    while stem + str(i) in _nodes:
        i += 1
    return stem + str(i)


def _add(name, ntype, parent=None):
    nd = _Node(name, ntype, parent)
    _nodes[name] = nd
    _order.append(name)
    if parent is not None:
        parent.children.append(nd)
    return nd


def _path(nd):
    parts = []
    x = nd
    while x is not None:
        parts.append(x.name)
        x = x.parent
    return '|' + '|'.join(reversed(parts))


def _reparent(nd, newp):
    if nd.parent is not None:
        nd.parent.children.remove(nd)
    nd.parent = newp
    if newp is not None:
        newp.children.append(nd)


def _split(plug):
    s = str(plug)
    if '.' not in s:
        raise ValueError('Se esperaba "nodo.atributo": %s' % plug)
    node, attr = s.split('.', 1)
    return _get(node), _SHORT.get(attr, attr)


# ---------------------------------------------------------------- escena
def file(*args, **kw):
    if kw.get('new') or kw.get('n'):
        _reset()
    return None


def warning(msg):
    import sys
    sys.stderr.write('# Warning: %s #\n' % msg)


def error(msg):
    raise RuntimeError(msg)


def undoInfo(openChunk=False, closeChunk=False, chunkName=None, **kw):
    if openChunk:
        _undo_log.append('open')
    elif closeChunk:
        _undo_log.append('close')
    return None


# ---------------------------------------------------------------- crear
def createNode(ntype, name=None, n=None, parent=None, p=None, skipSelect=False, ss=False):
    name = name or n
    parent = parent or p
    par = _get(parent) if parent else None
    nm = _unique(name) if name else _unique(ntype + '1')
    _add(nm, ntype, par)
    if not (skipSelect or ss):
        _sel[:] = [nm]
    return nm


def _xform_with_shape(name, shape_type):
    t = _add(_unique(name), 'transform')
    _add(_unique(t.name + 'Shape'), shape_type, t)
    _sel[:] = [t.name]
    return t


def spaceLocator(name=None, n=None, **kw):
    t = _xform_with_shape(name or n or 'locator1', 'locator')
    return [t.name]


def polyCube(name=None, n=None, **kw):
    t = _xform_with_shape(name or n or 'pCube1', 'mesh')
    hist = _add(_unique('polyCube1'), 'polyCube')
    return [t.name, hist.name]


def camera(name=None, n=None, **kw):
    t = _xform_with_shape(name or n or 'camera1', 'camera')
    return [t.name, t.children[0].name]


def joint(name=None, n=None, position=None, p=None, **kw):
    par = None
    if _sel and _sel[0] in _nodes and _nodes[_sel[0]].type == 'joint':
        par = _nodes[_sel[0]]
    j = _add(_unique(name or n or 'joint1'), 'joint', par)
    pos = position or p
    if pos:
        j.attrs['translateX'], j.attrs['translateY'], j.attrs['translateZ'] = [float(v) for v in pos]
    _sel[:] = [j.name]
    return j.name


def group(*objs, **kw):
    name = kw.get('name') or kw.get('n') or 'group1'
    objs = _flatten(objs)
    if not objs and not (kw.get('empty') or kw.get('em')):
        objs = list(_sel)
    g = _add(_unique(name), 'transform')
    if objs:
        first = _get(objs[0])
        if first.parent is not None and not (kw.get('world') or kw.get('w')):
            _reparent(g, first.parent)
        for o in objs:
            _reparent(_get(o), g)
    _sel[:] = [g.name]
    return g.name


# ---------------------------------------------------------------- jerarquía
def parent(*args, **kw):
    args = _flatten(args)
    if kw.get('world') or kw.get('w'):
        for o in args:
            _reparent(_get(o), None)
        return [_strip(o) for o in args]
    if len(args) < 2:
        raise RuntimeError('parent necesita al menos un hijo y un padre.')
    kids, par = args[:-1], args[-1]
    p = _get(par)
    for o in kids:
        nd = _get(o)
        x = p
        while x is not None:
            if x is nd:
                raise RuntimeError('No se puede emparentar un nodo bajo su propio descendiente.')
            x = x.parent
        _reparent(nd, p)
    return [_strip(o) for o in kids]


def listRelatives(*objs, **kw):
    objs = _flatten(objs) or list(_sel)
    t = kw.get('type') or kw.get('typ')
    full = kw.get('fullPath') or kw.get('f')
    res = []
    for o in objs:
        nd = _get(o)
        if kw.get('parent') or kw.get('p'):
            items = [nd.parent] if nd.parent is not None else []
        elif kw.get('allDescendents') or kw.get('ad'):
            items = []
            def walk(x):
                for ch in x.children:
                    walk(ch)
                    items.append(ch)
            walk(nd)
        else:
            items = list(nd.children)
        if kw.get('shapes') or kw.get('s'):
            items = [x for x in items if x.type in _SHAPES]
        if t:
            tt = t if isinstance(t, (list, tuple)) else [t]
            items = [x for x in items if x.type in tt]
        for x in items:
            v = _path(x) if full else x.name
            if v not in res:
                res.append(v)
    return res or None


# ---------------------------------------------------------------- consultar
def ls(*names, **kw):
    t = kw.get('type') or kw.get('typ')
    if kw.get('selection') or kw.get('sl'):
        cand = list(_sel)
    else:
        cand = list(_order)
    names = _flatten(names)
    if names:
        res = []
        for pat in names:
            pat = _strip(pat)
            for c in cand:
                if _fn.fnmatchcase(c, pat) and c not in res:
                    res.append(c)
        cand = res

    def ok(c):
        nd = _nodes[c]
        if t:
            tt = t if isinstance(t, (list, tuple)) else [t]
            if nd.type not in tt:
                return False
        if (kw.get('transforms') or kw.get('tr')) and nd.type not in _XFORM:
            return False
        if (kw.get('shapes') or kw.get('s')) and nd.type not in _SHAPES:
            return False
        if (kw.get('cameras') or kw.get('ca')) and nd.type != 'camera':
            return False
        if kw.get('dag') and nd.type not in _DAG:
            return False
        return True

    out = [c for c in cand if ok(c)]
    if kw.get('long') or kw.get('l'):
        out = [_path(_nodes[c]) if _nodes[c].type in _DAG else c for c in out]
    return out


def objExists(name):
    s = str(name)
    if '.' in s:
        node, attr = s.split('.', 1)
        k = _strip(node)
        return k in _nodes and _SHORT.get(attr, attr) in _nodes[k].attrs
    return _strip(s) in _nodes


def nodeType(name):
    return _get(name).type


def select(*objs, **kw):
    if kw.get('clear') or kw.get('cl'):
        del _sel[:]
        return None
    objs = [_strip(o) for o in _flatten(objs)]
    for o in objs:
        _get(o)
    if kw.get('add'):
        _sel.extend([o for o in objs if o not in _sel])
    else:
        _sel[:] = objs
    return None


# ---------------------------------------------------------------- renombrar / borrar
def _ren_plug(plug, old, new):
    node, attr = plug.split('.', 1)
    return (new if node == old else node) + '.' + attr


def rename(old, new, **kw):
    nd = _get(old)
    new = _strip(new)
    if new == nd.name:
        return new
    nn = _unique(new)
    del _nodes[nd.name]
    _order[_order.index(nd.name)] = nn
    for i, (s, d) in enumerate(_conns):
        _conns[i] = (_ren_plug(s, nd.name, nn), _ren_plug(d, nd.name, nn))
    _sel[:] = [nn if x == nd.name else x for x in _sel]
    nd.name = nn
    _nodes[nn] = nd
    return nn


def _del(nd):
    for c in list(nd.children):
        _del(c)
    if nd.parent is not None:
        nd.parent.children.remove(nd)
    del _nodes[nd.name]
    _order.remove(nd.name)
    _conns[:] = [(s, d) for s, d in _conns if s.split('.')[0] != nd.name and d.split('.')[0] != nd.name]
    if nd.name in _sel:
        _sel.remove(nd.name)


def delete(*objs, **kw):
    objs = _flatten(objs) or list(_sel)
    for o in objs:
        k = _strip(o)
        if k in _nodes:
            _del(_nodes[k])
    return None


# ---------------------------------------------------------------- atributos
def _eval_key(keys, tm):
    ts = sorted(keys)
    if tm <= ts[0]:
        return keys[ts[0]]
    if tm >= ts[-1]:
        return keys[ts[-1]]
    for a, b in zip(ts, ts[1:]):
        if a <= tm <= b:
            return keys[a] + (keys[b] - keys[a]) * (tm - a) / (b - a)


def getAttr(plug, time=None, t=None, **kw):
    nd, a = _split(plug)
    if a in ('translate', 'rotate', 'scale'):
        return [tuple(nd.attrs[a + ax] for ax in 'XYZ')]
    if a not in nd.attrs:
        raise ValueError('No object matches name: %s' % plug)
    tm = time if time is not None else t
    if a in nd.keys and nd.keys[a]:
        return _eval_key(nd.keys[a], _state['time'] if tm is None else float(tm))
    return nd.attrs[a]


def setAttr(plug, *vals, **kw):
    nd, a = _split(plug)
    if a in ('translate', 'rotate', 'scale'):
        for ax, v in zip('XYZ', vals):
            nd.attrs[a + ax] = float(v)
        return None
    if a not in nd.attrs:
        raise ValueError('No object matches name: %s' % plug)
    if any(d == nd.name + '.' + a for s, d in _conns):
        raise RuntimeError("El atributo '%s' está conectado y no se puede cambiar." % plug)
    if kw.get('type') == 'string':
        nd.attrs[a] = str(vals[0])
        return None
    v = vals[0]
    old = nd.attrs[a]
    if isinstance(old, bool):
        v = bool(v)
    elif isinstance(old, float):
        v = float(v)
    elif isinstance(old, int):
        v = int(v)
    nd.attrs[a] = v
    return None


def addAttr(node, longName=None, ln=None, attributeType=None, at=None, dataType=None, dt=None,
            defaultValue=None, dv=None, **kw):
    nd = _get(node)
    name = longName or ln
    if not name:
        raise RuntimeError('addAttr necesita longName.')
    if name in nd.attrs:
        raise RuntimeError("Ya existe un atributo llamado '%s' en '%s'." % (name, nd.name))
    typ = attributeType or at or dataType or dt or 'double'
    d = defaultValue if defaultValue is not None else dv
    if typ in ('double', 'float'):
        val = float(d or 0.0)
    elif typ in ('long', 'short', 'int', 'byte'):
        val = int(d or 0)
    elif typ == 'bool':
        val = bool(d)
    elif typ == 'string':
        val = ''
    else:
        val = d
    nd.attrs[name] = val
    nd.user.append(name)
    return None


def attributeQuery(attr, node=None, n=None, exists=False, ex=False, **kw):
    nd = _get(node or n)
    return _SHORT.get(attr, attr) in nd.attrs


def listAttr(node, userDefined=False, ud=False, **kw):
    nd = _get(node)
    if userDefined or ud:
        return list(nd.user) or None
    return list(nd.attrs.keys())


# ---------------------------------------------------------------- conexiones
def connectAttr(src, dst, force=False, f=False, **kw):
    sn, sa = _split(src)
    dn, da = _split(dst)
    if sa not in sn.attrs:
        raise RuntimeError('No existe el atributo: %s' % src)
    if da not in dn.attrs:
        raise RuntimeError('No existe el atributo: %s' % dst)
    sp, dp = sn.name + '.' + sa, dn.name + '.' + da
    if (sp, dp) in _conns:
        raise RuntimeError("'%s' ya está conectado a '%s'." % (sp, dp))
    existing = [c for c in _conns if c[1] == dp]
    if existing:
        if force or f:
            _conns.remove(existing[0])
        else:
            raise RuntimeError("'%s' ya tiene una conexión de entrada. Usa force=True." % dp)
    _conns.append((sp, dp))
    return None


def disconnectAttr(src, dst, **kw):
    sn, sa = _split(src)
    dn, da = _split(dst)
    c = (sn.name + '.' + sa, dn.name + '.' + da)
    if c not in _conns:
        raise RuntimeError('No hay conexión entre %s y %s.' % c)
    _conns.remove(c)
    return None


def isConnected(src, dst, **kw):
    sn, sa = _split(src)
    dn, da = _split(dst)
    return (sn.name + '.' + sa, dn.name + '.' + da) in _conns


def listConnections(obj, source=None, s=None, destination=None, d=None, plugs=False, p=False, **kw):
    src = True if (source is None and s is None) else bool(source or s)
    dst = True if (destination is None and d is None) else bool(destination or d)
    plugs = plugs or p
    o = str(obj)
    res = []
    for sp, dp in _conns:
        if '.' in o:
            node, attr = o.split('.', 1)
            full = _strip(node) + '.' + _SHORT.get(attr, attr)
            if dst and sp == full:
                res.append(dp if plugs else dp.split('.')[0])
            if src and dp == full:
                res.append(sp if plugs else sp.split('.')[0])
        else:
            n = _strip(o)
            if dst and sp.split('.')[0] == n:
                res.append(dp if plugs else dp.split('.')[0])
            if src and dp.split('.')[0] == n:
                res.append(sp if plugs else sp.split('.')[0])
    return res or None


# ---------------------------------------------------------------- tiempo y keyframes
def currentTime(t=None, query=False, q=False, **kw):
    if query or q or t is None:
        return _state['time']
    _state['time'] = float(t)
    return _state['time']


def playbackOptions(query=False, q=False, minTime=None, min=None, maxTime=None, max=None, **kw):
    if query or q:
        if minTime or min:
            return _state['min']
        if maxTime or max:
            return _state['max']
        return None
    lo = minTime if minTime is not None else min
    hi = maxTime if maxTime is not None else max
    if lo is not None:
        _state['min'] = float(lo)
    if hi is not None:
        _state['max'] = float(hi)
    return None


def _anim_attrs(nd):
    return [a for a in nd.attrs if a[:-1] in ('translate', 'rotate', 'scale')]


def setKeyframe(obj=None, attribute=None, at=None, time=None, t=None, value=None, v=None, **kw):
    objs = _flatten([obj]) if obj else list(_sel)
    attrs = attribute or at
    tm = time if time is not None else t
    if isinstance(tm, (list, tuple)):
        tm = tm[0]
    if tm is None:
        tm = _state['time']
    val = value if value is not None else v
    count = 0
    for o in objs:
        nd = _get(o)
        alist = [attrs] if isinstance(attrs, str) else (attrs or _anim_attrs(nd))
        for a in [_SHORT.get(x, x) for x in alist]:
            if a not in nd.attrs:
                raise ValueError('No object matches name: %s.%s' % (nd.name, a))
            cur = val if val is not None else getAttr(nd.name + '.' + a, time=tm)
            nd.keys.setdefault(a, {})[float(tm)] = float(cur)
            count += 1
    return count


def keyframe(obj=None, attribute=None, at=None, query=False, q=False, timeChange=False, tc=False,
             valueChange=False, vc=False, keyframeCount=False, kc=False, time=None, t=None, **kw):
    nd = _get(obj if obj else _sel[0])
    a = attribute or at
    attrs = [_SHORT.get(a, a)] if a else list(nd.keys)
    items = []
    for x in attrs:
        for tm, vv in sorted(nd.keys.get(x, {}).items()):
            items.append((tm, vv))
    rng = time if time is not None else t
    if rng is not None:
        lo, hi = (rng if isinstance(rng, (list, tuple)) else (rng, rng))
        items = [i for i in items if lo <= i[0] <= hi]
    if keyframeCount or kc:
        return len(items)
    if timeChange or tc:
        return [i[0] for i in items] or None
    if valueChange or vc:
        return [i[1] for i in items] or None
    return len(items)


def cutKey(obj=None, attribute=None, at=None, time=None, t=None, **kw):
    nd = _get(obj if obj else _sel[0])
    a = attribute or at
    attrs = [_SHORT.get(a, a)] if a else list(nd.keys)
    rng = time if time is not None else t
    n = 0
    for x in attrs:
        ks = nd.keys.get(x, {})
        for tm in list(ks):
            if rng is None or (rng[0] <= tm <= rng[1] if isinstance(rng, (list, tuple)) else tm == rng):
                del ks[tm]
                n += 1
    return n


def xform(obj, query=False, q=False, worldSpace=False, ws=False, translation=False, t=False, **kw):
    nd = _get(obj)
    if not (query or q):
        raise RuntimeError('En este simulador, xform solo sirve para consultar (query=True).')
    tx, ty, tz = nd.attrs['translateX'], nd.attrs['translateY'], nd.attrs['translateZ']
    if worldSpace or ws:
        x = nd.parent
        while x is not None:
            if x.type in _XFORM:
                tx += x.attrs['translateX']
                ty += x.attrs['translateY']
                tz += x.attrs['translateZ']
            x = x.parent
    return [tx, ty, tz]
`;
