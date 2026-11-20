TA.add({
  id: 'd02',
  title: 'Requirements first',

  explain: [
    'The most expensive mistake a TA can make is quickly building **the wrong tool**. Before writing a single line, understand what is really needed.',
    { type: 'analogy', text: 'you are a tailor. If you make the suit without taking measurements, it may be beautiful, but it will fit nobody. The questions are the measurements.' },
    '### The key questions',
    '- **Who** will use it? Animators, lighters, the render farm?\n- **What problem** do they have today? How much time does it cost them?\n- **What data** does it work with? How much? (10 shots or 2,000 changes the whole design.)\n- **What comes out** of the tool and who receives it next?\n- **What must not fail?** What happens if it fails halfway?\n- **Is there a deadline?** Do we need something small now and something complete later?',
    '### In the interview: ask before answering',
    'If they give you a design problem («make a tool that exports cameras»), **do not start designing right away**. Ask 2 or 3 questions. Interviewers expect it: it shows how you work in a real team.',
    { type: 'tip', text: 'a useful sentence: «Before designing it, I would like to clarify three things: how many shots there are, which format, and who receives the result». Then, if there is no answer, say what you **assume** and carry on.' },
    '### Start small',
    'First build a minimal version that solves the most painful part. Give it to one or two artists, watch how they use it and improve it. That beats spending two months on a huge tool nobody asked for in that form.',
    { type: 'cg', text: 'a director asks for «a tool to review the cutscenes». After asking, it turns out what they really want is to watch every shot back to back with the name and frame on top. That takes a day, not a month.' }
  ],

  example: {
    intro: 'Request: «We need a tool to export the cameras».',
    lines: [
      { label: 'Rushed answer', code: '«OK, I\'ll make a button that exports the selected camera to FBX.»', note: 'Might be useless: what if there are 300 shots? What if the engine needs another format?' },
      { label: 'Ask first', code: 'How many cameras/shots per delivery?\nWhich format and naming convention does the engine expect?\nDo we also export the frame range and focal length?\nWho uses it: the artist or a nightly process?', note: 'Every answer changes the design.' },
      { label: 'Fitted design', code: 'Batch per sequence, finds cameras by their shotName attribute,\nnames files following the engine convention,\nheadless mode for the nightly process.', note: 'Now it solves the real problem.' }
    ]
  },

  mini: [
    {
      q: 'In the interview they ask you to design a tool. What do you do first?',
      options: ['Start writing code on the whiteboard', 'Ask 2-3 questions to clarify the problem (or say what you assume)', 'Say you need more time'],
      answer: 1,
      why: 'It shows you understand that the design depends on the requirements.'
    },
    {
      q: 'Why does it matter whether there are 10 or 2,000 items?',
      options: ['It does not', 'It changes the design: performance, batching, reports, whether a UI is needed', 'Only because of memory'],
      answer: 1,
      why: 'With 2,000, you need batches, performance, reports and maybe headless runs.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'What would you ask?',
      prompt: 'A supervisor tells you: «I want a tool that checks animation scenes before they go to lighting».\n\nWrite the questions you would ask before designing anything, and what you would assume if nobody answers.',
      checklist: [
        'I ask **what** exactly needs checking (names, frame range, keys out of range, references, cameras…).',
        'I ask **how many** scenes and how often (one at a time or in batches).',
        'I ask **who** uses it and when (on save, on publish, overnight).',
        'I ask what happens if something fails: does it block the handoff or just warn?',
        'I ask how the result is delivered (window, report, message to the supervisor).',
        'I say what I assume if there is no answer and propose starting with a small version.'
      ],
      model: '«Before designing it I would ask:\n- What problems reach lighting today? That tells me what to check first.\n- How many scenes per day? Are they sent one at a time or all at the end?\n- Does the animator run it before publishing, or does it run automatically on publish?\n- If there is an error, is the handoff blocked or just flagged?\n- Who needs to see the result?\n\nWithout answers, I would assume: it runs on publish, checks names, frame range and cameras, warns without blocking and writes a report. I would start with the three checks that cause the most trouble and add more later.»',
      followups: ['Which check would you build first and why?', 'How would you decide between blocking and just warning?']
    }
  ],

  summary: [
    'Before building: who, what problem, how much data, what comes out, what must not fail.',
    'In the interview, ask 2-3 things or state your assumptions before designing.',
    'Start with a minimal version, give it to a few artists and improve it.'
  ]
});
