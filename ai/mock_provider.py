"""
Mock AI Provider
Owned by: Ekansh (AI/ML Evaluation)

Deterministic, offline "AI" used for the demo: no API keys, no network.
- Chat: keyword -> lesson lookup (whole-word matching, first match wins).
- Evaluation: grades against the backend answer key with fixed thresholds.
"""

import re
from typing import List, Dict, Any, Optional
from .base import BaseAIProvider


# (keywords, lesson, follow-ups). Order matters: more specific topics first.
LESSONS = [
    (
        ["comprehension", "comprehensions"],
        "**List comprehensions** build a list in one readable expression.\n\n"
        "**Syntax**: `[expression for item in iterable if condition]`\n\n"
        "```python\n"
        "evens_squared = [x**2 for x in range(10) if x % 2 == 0]\n"
        "# [0, 4, 16, 36, 64]\n"
        "```\n"
        "Swap `[]` for `()` to get a **generator expression** that computes items lazily, "
        "and use `{k: v for ...}` for a dict comprehension.",
        ["How does a generator expression differ from a list comprehension?",
         "What is dictionary comprehension syntax?",
         "When should I avoid list comprehensions?"],
    ),
    (
        ["generator", "generators", "yield", "lazy"],
        "A **generator** produces values one at a time, only when asked, so it uses O(1) memory.\n\n"
        "```python\n"
        "def countdown(n):\n"
        "    while n > 0:\n"
        "        yield n\n"
        "        n -= 1\n\n"
        "for x in countdown(3):\n"
        "    print(x)   # 3, 2, 1\n"
        "```\n"
        "`(x*x for x in range(10**6))` is a generator expression: nothing is computed until you iterate. "
        "Generators can be consumed **only once**.",
        ["How do list comprehensions work?",
         "What does the itertools module offer?",
         "How do loops work in Python?"],
    ),
    (
        ["decorator", "decorators"],
        "A **decorator** wraps a function to add behaviour without editing it.\n\n"
        "```python\n"
        "import functools, time\n\n"
        "def timer(func):\n"
        "    @functools.wraps(func)\n"
        "    def wrapper(*args, **kwargs):\n"
        "        t0 = time.perf_counter()\n"
        "        result = func(*args, **kwargs)\n"
        "        print(f'{func.__name__} took {time.perf_counter() - t0:.4f}s')\n"
        "        return result\n"
        "    return wrapper\n\n"
        "@timer\n"
        "def slow_add(a, b):\n"
        "    return a + b\n"
        "```\n"
        "`@timer` is shorthand for `slow_add = timer(slow_add)`.",
        ["What are *args and **kwargs?",
         "How do closures work in Python?",
         "Explain Python scope (LEGB)"],
    ),
    (
        ["scope", "legb", "global", "nonlocal", "closure", "closures"],
        "Python looks up names using the **LEGB** rule:\n\n"
        "1. **Local**: inside the current function\n"
        "2. **Enclosing**: inside any outer (enclosing) function\n"
        "3. **Global**: module level\n"
        "4. **Built-in**: `len`, `print`, `range`, ...\n\n"
        "```python\n"
        "x = 'global'\n"
        "def outer():\n"
        "    x = 'enclosing'\n"
        "    def inner():\n"
        "        return x      # finds 'enclosing'\n"
        "    return inner()\n"
        "```\n"
        "Use `nonlocal` to rebind an enclosing variable and `global` for a module variable. A function that "
        "remembers enclosing variables is a **closure**.",
        ["What is a Python decorator?",
         "How do functions work in Python?",
         "What is the difference between mutable and immutable types?"],
    ),
    (
        ["args", "kwargs", "*args", "**kwargs"],
        "`*args` collects extra **positional** arguments into a tuple; `**kwargs` collects extra **keyword** "
        "arguments into a dict.\n\n"
        "```python\n"
        "def report(title, *args, **kwargs):\n"
        "    print(title, args, kwargs)\n\n"
        "report('Scores', 90, 85, student='Asha')\n"
        "# Scores (90, 85) {'student': 'Asha'}\n"
        "```\n"
        "The same stars **unpack** at call time: `f(*my_list, **my_dict)`.",
        ["What is a Python decorator?",
         "How do default arguments behave?",
         "Explain Python scope (LEGB)"],
    ),
    (
        ["mutable", "immutable", "mutability", "default", "reference", "references", "copy"],
        "**Mutable** objects (`list`, `dict`, `set`) can change in place; **immutable** ones "
        "(`int`, `str`, `tuple`, `frozenset`) cannot.\n\n"
        "Variables are *references*. Two names can point to the same list:\n"
        "```python\n"
        "a = [1, 2]\n"
        "b = a\n"
        "b.append(3)\n"
        "print(a)   # [1, 2, 3]  same object!\n"
        "```\n"
        "**Classic trap**: default arguments are evaluated once, so `def f(items=[])` shares one list "
        "across calls. Use `def f(items=None): items = items or []` instead. Copy with `a.copy()` "
        "or `copy.deepcopy(a)` for nested data.",
        ["Why can't a list be a dictionary key?",
         "How do lists differ from tuples?",
         "How do functions work in Python?"],
    ),
    (
        ["slice", "slicing", "slices", "index", "indexing"],
        "**Slicing** uses `seq[start:stop:step]`; `stop` is *excluded*.\n\n"
        "```python\n"
        "data = [10, 20, 30, 40, 50]\n"
        "data[1:4]     # [20, 30, 40]\n"
        "data[::-1]    # [50, 40, 30, 20, 10]\n"
        "data[3:0:-1]  # [40, 30, 20]\n"
        "data[1:4:-1]  # []  (can't walk backwards from 1 to 4)\n"
        "```\n"
        "Negative indices count from the end: `data[-1]` is `50`. Slicing a list returns a **new** list.",
        ["How do lists differ from tuples?",
         "How do list comprehensions work?",
         "How do strings work in Python?"],
    ),
    (
        ["dict", "dictionary", "dictionaries", "hash", "hashable", "key", "keys"],
        "A **dictionary** maps keys to values with O(1) average lookup, using a hash table.\n\n"
        "```python\n"
        "scores = {'asha': 92, 'ravi': 78}\n"
        "scores['meera'] = 88\n"
        "scores.get('john', 0)    # 0 (no KeyError)\n"
        "for name, score in scores.items():\n"
        "    print(name, score)\n"
        "```\n"
        "Keys must be **hashable** (immutable): `str`, `int`, `tuple` work, `list` raises "
        "`TypeError: unhashable type: 'list'`.",
        ["What is dictionary comprehension syntax?",
         "What is the difference between mutable and immutable types?",
         "How do sets work?"],
    ),
    (
        ["list", "lists", "tuple", "tuples", "set", "sets", "collection", "collections"],
        "Python's core collections:\n\n"
        "1. **List `[]`**: ordered, mutable. `items.append(4)`\n"
        "2. **Tuple `()`**: ordered, **immutable**. Good for fixed records and dict keys.\n"
        "3. **Dict `{k: v}`**: key-value mapping with fast lookup.\n"
        "4. **Set `{1, 2}`**: unordered, unique items, fast membership tests.\n\n"
        "```python\n"
        "unique = set([3, 1, 3, 2])   # {1, 2, 3}\n"
        "point = (4, 5)               # tuple\n"
        "```\n"
        "If data shouldn't change after creation, prefer a tuple.",
        ["How does a list comprehension work?",
         "Why can't a list be used as a dictionary key?",
         "How does slicing work?"],
    ),
    (
        ["string", "strings", "str", "f-string", "fstring", "format"],
        "**Strings** are immutable sequences of characters.\n\n"
        "```python\n"
        "name = 'PragyaX'\n"
        "name.upper()          # 'PRAGYAX'\n"
        "name[0:6]             # 'Pragya'\n"
        "', '.join(['a', 'b'])  # 'a, b'\n"
        "f'Hello {name}, 2+2={2+2}'   # f-string formatting\n"
        "```\n"
        "Because strings are immutable, methods like `.replace()` return a **new** string.",
        ["How does slicing work?",
         "What is the difference between mutable and immutable types?",
         "How do loops work in Python?"],
    ),
    (
        ["exception", "exceptions", "error", "errors", "try", "except", "raise"],
        "Handle errors with **try / except**:\n\n"
        "```python\n"
        "try:\n"
        "    value = int(input('Number: '))\n"
        "except ValueError:\n"
        "    print('That was not a number')\n"
        "else:\n"
        "    print('Got', value)\n"
        "finally:\n"
        "    print('Always runs')\n"
        "```\n"
        "Catch **specific** exceptions (not bare `except:`), and `raise ValueError('msg')` to signal problems.",
        ["How do functions work in Python?",
         "How do classes work in Python?",
         "How do I read a file in Python?"],
    ),
    (
        ["class", "classes", "object", "objects", "oop", "inheritance", "self", "init", "__init__", "classmethod", "staticmethod", "dunder", "method", "methods"],
        "Python is object-oriented: a **class** is a blueprint, an **instance** is an object built from it.\n\n"
        "```python\n"
        "class Student:\n"
        "    def __init__(self, name):\n"
        "        self.name = name\n"
        "        self.xp = 0\n\n"
        "    def earn(self, points):\n"
        "        self.xp += points\n\n"
        "class Mentor(Student):          # inheritance\n"
        "    def earn(self, points):\n"
        "        super().earn(points * 2)\n"
        "```\n"
        "`self` is the instance; `super()` calls the parent. Python favours **duck typing**: "
        "if it has the method you need, you can use it.",
        ["What is the difference between @staticmethod and @classmethod?",
         "What are dunder methods like __str__?",
         "How do exceptions work?"],
    ),
    (
        ["function", "functions", "def", "lambda", "return", "parameter", "parameters", "argument", "arguments"],
        "Functions package reusable logic. They are **first-class objects**: you can pass and return them.\n\n"
        "```python\n"
        "def grade(score: int) -> str:\n"
        "    return 'Pass' if score >= 3 else 'Needs practice'\n\n"
        "square = lambda x: x * x      # small anonymous function\n"
        "sorted(['bb', 'a'], key=len)  # pass a function as an argument\n"
        "```\n"
        "**Watch out**: never use a mutable default like `def f(items=[])`; it's created only once.",
        ["What are *args and **kwargs?",
         "What is a Python decorator?",
         "Explain Python scope (LEGB)"],
    ),
    (
        ["recursion", "recursive"],
        "**Recursion** is a function calling itself on a smaller problem until it reaches a **base case**.\n\n"
        "```python\n"
        "def factorial(n):\n"
        "    if n <= 1:          # base case\n"
        "        return 1\n"
        "    return n * factorial(n - 1)\n"
        "```\n"
        "Python's default recursion limit is about 1000 frames; for deep problems prefer a loop.",
        ["How do loops work in Python?",
         "How do functions work in Python?",
         "What is a generator?"],
    ),
    (
        ["loop", "loops", "for", "while", "range", "enumerate", "break", "continue", "iterate"],
        "Python has two loops:\n\n"
        "```python\n"
        "for i, lang in enumerate(['Python', 'SQL']):\n"
        "    print(i, lang)\n\n"
        "n = 3\n"
        "while n > 0:\n"
        "    n -= 1\n"
        "```\n"
        "- `break` exits the loop, `continue` skips to the next iteration.\n"
        "- `range(start, stop, step)` generates numbers lazily.\n"
        "- Loops support an `else:` block that runs only if no `break` happened.",
        ["How do list comprehensions work?",
         "What is a generator?",
         "How do conditionals work?"],
    ),
    (
        ["if", "elif", "else", "condition", "conditions", "conditional", "conditionals", "boolean", "bool"],
        "**Conditionals** choose which code runs:\n\n"
        "```python\n"
        "score = 4\n"
        "if score == 5:\n"
        "    level = 'Advanced'\n"
        "elif score >= 3:\n"
        "    level = 'Intermediate'\n"
        "else:\n"
        "    level = 'Beginner'\n"
        "```\n"
        "Empty values (`0`, `''`, `[]`, `None`) are **falsy**. Combine tests with `and`, `or`, `not`, "
        "and use the one-liner `x if cond else y` for simple cases.",
        ["How do loops work in Python?",
         "What are Python data types?",
         "How do functions work in Python?"],
    ),
    (
        ["file", "files", "open", "read", "write", "with"],
        "Use `with open(...)` so files close automatically:\n\n"
        "```python\n"
        "with open('notes.txt', 'w', encoding='utf-8') as f:\n"
        "    f.write('Learn Python\\n')\n\n"
        "with open('notes.txt', encoding='utf-8') as f:\n"
        "    for line in f:\n"
        "        print(line.strip())\n"
        "```\n"
        "Modes: `'r'` read, `'w'` overwrite, `'a'` append. Wrap in `try/except FileNotFoundError` when needed.",
        ["How do exceptions work?",
         "How do strings work in Python?",
         "How do modules and imports work?"],
    ),
    (
        ["module", "modules", "import", "package", "packages", "pip"],
        "A **module** is any `.py` file; a **package** is a folder of modules.\n\n"
        "```python\n"
        "import math\n"
        "from collections import Counter\n\n"
        "math.sqrt(16)                 # 4.0\n"
        "Counter('banana')             # {'a': 3, 'n': 2, 'b': 1}\n"
        "```\n"
        "Install third-party packages with `pip install <name>` inside a virtual environment "
        "(`python -m venv .venv`).",
        ["How do I read a file in Python?",
         "How do classes work in Python?",
         "What is a generator?"],
    ),
    (
        ["variable", "variables", "type", "types", "int", "float", "data", "datatype"],
        "Variables are **names bound to objects**; Python infers the type at runtime.\n\n"
        "```python\n"
        "age = 21          # int\n"
        "pi = 3.14         # float\n"
        "name = 'Asha'     # str\n"
        "ready = True      # bool\n"
        "type(age)         # <class 'int'>\n"
        "isinstance(pi, float)  # True\n"
        "```\n"
        "Python is **dynamically** but **strongly** typed: `'3' + 3` raises a `TypeError`. "
        "Convert explicitly with `int('3')` or `str(3)`.",
        ["What is the difference between mutable and immutable types?",
         "How do lists differ from tuples?",
         "How do strings work in Python?"],
    ),
]

GREETING_WORDS = {"hi", "hello", "hey", "namaste", "start", "help"}

STARTER_FOLLOWUPS = [
    "What are Python data types?",
    "How do list comprehensions work?",
    "Explain Python scope (LEGB)",
]

# Maps an assessment question topic to a concrete next lesson.
TOPIC_RECOMMENDATIONS = {
    "Default Parameter Evaluation & Mutability": "Mutable vs immutable objects and safe default arguments",
    "Sequence Slicing & Negative Steps": "Sequence slicing with start/stop/step and negative indices",
    "Hash Tables, Mutability & Dictionary Keys": "Dictionaries, hashing and why keys must be immutable",
    "List Comprehensions vs Generator Expressions": "Generators and lazy evaluation vs list comprehensions",
    "LEGB Variable Scope & Closures": "Variable scope (LEGB), closures and the nonlocal keyword",
}

ADVANCED_RECOMMENDATIONS = [
    "Decorators and functools.wraps",
    "Iterators, generators and itertools",
    "Async programming with asyncio",
]

# Deterministic proficiency thresholds (score out of 5):
#   0-2 -> Beginner, 3-4 -> Intermediate, 5 -> Advanced
def proficiency_for(score: int, total: int) -> str:
    ratio = score / total if total else 0
    if ratio >= 1.0:
        return "Advanced"
    if ratio >= 0.6:
        return "Intermediate"
    return "Beginner"


def _words(text: str) -> set:
    return set(re.findall(r"[a-z_*\-]+", text.lower()))


def _find_lesson(text: str) -> Optional[tuple]:
    words = _words(text)
    for keywords, lesson, followups in LESSONS:
        if words & set(keywords):
            return lesson, followups
    return None


class MockAIProvider(BaseAIProvider):
    """Deterministic local AI engine for the PragyaX demo."""

    @property
    def provider_name(self) -> str:
        return "PragyaX Mock AI (deterministic)"

    @property
    def is_mock(self) -> bool:
        return True

    def generate_chat_response(
        self, prompt: str, subject: str = "Python Programming", history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        found = _find_lesson(prompt)
        if found:
            reply, followups = found
        elif _words(prompt) & GREETING_WORDS:
            reply = (
                f"Hi! I'm your **{subject}** study buddy (Demo AI).\n\n"
                "Ask me about a concept and I'll explain it with a short example. Good places to start:\n"
                "- Data types and variables\n"
                "- Lists, tuples, dicts and sets\n"
                "- Functions, scope and decorators\n"
                "- Loops, comprehensions and generators\n\n"
                "When you feel ready, take the 5-question assessment to measure your level."
            )
            followups = STARTER_FOLLOWUPS
        else:
            reply = (
                "I'm the offline **Demo AI**, so I can only teach the core Python topics I know. "
                "I couldn't match your question to one of them.\n\n"
                "Try asking about: **variables & types, strings, conditionals, loops, lists/tuples/sets, "
                "dictionaries, slicing, comprehensions, generators, functions, *args/**kwargs, scope (LEGB), "
                "decorators, classes, exceptions, files, modules, recursion or mutability**.\n\n"
                "Tip: the assessment focuses on mutability, slicing, dictionary keys, comprehensions and scope."
            )
            followups = STARTER_FOLLOWUPS

        return {
            "reply": reply,
            "provider": self.provider_name,
            "is_mock": self.is_mock,
            "suggested_followups": followups,
        }

    def evaluate_assessment(
        self,
        subject: str,
        questions: List[Dict[str, Any]],
        user_answers: Dict[str, str],
    ) -> Dict[str, Any]:
        total = len(questions)
        score = 0
        breakdown = []
        missed_topics: List[str] = []

        for q in questions:
            correct = str(q["correct_option"]).upper()
            selected = str(user_answers.get(q["id"], "")).strip().upper()
            is_correct = selected == correct
            if is_correct:
                score += 1
            else:
                missed_topics.append(q.get("topic", "Python fundamentals"))

            breakdown.append({
                "question_id": q["id"],
                "question_text": q["question_text"],
                "selected_option": selected or "Unanswered",
                "correct_option": correct,
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
                "topic": q.get("topic", "Python fundamentals"),
            })

        percentage = round(score / total * 100, 1) if total else 0.0
        level = proficiency_for(score, total)

        if level == "Advanced":
            summary = (f"Perfect score: {score}/{total} ({percentage}%). You have a strong grasp of these "
                       f"{subject} fundamentals. Move on to the advanced topics below.")
        elif level == "Intermediate":
            summary = (f"Good work: {score}/{total} ({percentage}%). Your core {subject} knowledge is solid; "
                       "review the questions you missed to close the gaps.")
        else:
            summary = (f"You scored {score}/{total} ({percentage}%). Start with the recommended topics below, "
                       "then use the Learning Chat to practise each concept before retaking the assessment.")

        recommended = [TOPIC_RECOMMENDATIONS.get(t, f"Review: {t}") for t in missed_topics] or ADVANCED_RECOMMENDATIONS

        return {
            "score": score,
            "total": total,
            "percentage": percentage,
            "proficiency_level": level,
            "breakdown": breakdown,
            "recommended_topics": recommended,
            "summary_feedback": summary,
            "is_mock": self.is_mock,
            "provider": self.provider_name,
        }
