# Chapter argument grading

This diagnostic submits one chapter to multiple providers under a separately
frozen reading rubric and canonical premises. Optional background chapters are
evidence dependencies, not additional grading targets.

The grader returns categorical judgments rather than numerical scores. It must
separate linguistic admission from symbolic or theological synthesis, identify
the strongest rival joint model, and distinguish missing chapter evidence from
evaluator uncertainty or a missing protocol rule.

Credential files are loaded only at runtime and are never copied into a run.

```sh
python3 chapter-grading/run.py \
  --run-id 2026-07-13-example \
  --chapter /path/to/chapter.adoc \
  --rules /path/to/approved-rules.md \
  --premises /path/to/canonical-premises.md \
  --background /path/to/background-chapter.adoc \
  --key-file openai=/path/to/key
```
