#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate a proposal ledger for the symbolic-language manuscript.

This is deliberately not an accept/apply tool. It only reads the current
manuscript and writes review artifacts: CSV rows, human previews, candidate
patches, and campaign notes for broader edits.
"""

from __future__ import annotations

import csv
import dataclasses
import difflib
import hashlib
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
BOOK = ROOT / "books" / "symbolic-language"
OUT = BOOK / "editorial-review" / "2026-07-09-initial-audit"


@dataclasses.dataclass(frozen=True)
class Proposal:
    file: str
    old: str
    new: str
    type: str
    severity: str
    summary: str
    rationale: str
    campaign: str = ""
    scope: str = "localized"


PROPOSALS: list[Proposal] = [
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "When you read scripture, you read its words through the lens of your own private dictionary and personal associations.",
        "When you read scripture, you bring your own private dictionary and personal associations to its words.",
        "tone-register",
        "low",
        "Replace stock lens metaphor with direct prose.",
        "The phrase 'through the lens of' is a familiar AI/editorial crutch. The revision says the same thing with less cognitive load.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/01-introduction.adoc",
        "That is milk's failure mode, lived out — they received, and never chewed.",
        "That is milk's danger, lived out — they received, and never chewed.",
        "tone-register",
        "low",
        "Replace technical register phrase 'failure mode'.",
        "'Failure mode' sounds like product/engineering prose. 'Danger' keeps the warning in book voice.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/02-the-parables-of-the-kingdom.adoc",
        "Mark what has changed between their seat and yours.",
        "The difference between their seat and yours matters.",
        "ai-sounding-staging",
        "medium",
        "Remove stage-direction command to the reader.",
        "The original tells the reader how to read instead of simply making the transition.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/02-the-parables-of-the-kingdom.adoc",
        "The disciple on the shore had his memory and the weekly reading; you have the whole corpus searchable in a breath — a concordance, a search bar, an AI that can sweep every use of a word while you frame your next question.",
        "The disciple on the shore had his memory and the weekly reading; you have the whole text searchable in moments — a concordance, a search bar, and tools that can gather every use of a word while you frame your next question.",
        "tone-register",
        "medium",
        "Soften AI-forward wording and the academic 'corpus'.",
        "The sentence is useful, but 'whole corpus searchable in a breath' and naming AI in the body prose draws attention to process rather than method.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Now watch the fulfillment.",
        "The fulfillment follows the same pattern.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now watch' staging transition.",
        "The revised line moves the argument forward without sounding like a presenter cue.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Now lay the two stories side by side, scene for scene — the whole pattern stands in the table that closes this chapter — and judge for yourself whether this correspondence could be accidental.",
        "Laid side by side, scene for scene, the two stories form the pattern shown in the table that closes this chapter.",
        "ai-sounding-staging",
        "medium",
        "Cut meta-instruction and rhetorical pressure.",
        "The original asks the reader to perform the author's persuasion. The revision states the evidence more calmly.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Weigh what the sign proves.",
        "The sign proves a specific claim.",
        "ai-sounding-staging",
        "low",
        "Replace imperative transition.",
        "The revision keeps the transition but removes the stage-command cadence.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/04-sign-of-jonah.adoc",
        "Scripture photographs the two sets of jaws at the moment of the swallowing: __“both Herod, and Pontius Pilate, with the Gentiles, and the people of Israel, were gathered together”__ (Acts 4:27).",
        "Scripture frames the two sets of jaws at the moment of the swallowing: __“both Herod, and Pontius Pilate, with the Gentiles, and the people of Israel, were gathered together”__ (Acts 4:27).",
        "bad-metaphor",
        "low",
        "Replace modern camera metaphor.",
        "'Photographs' is anachronistic and draws attention to the metaphor. 'Frames' is quieter and still visual.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/05-gospel.adoc",
        "But as a definition it fails the corpus.",
        "But as a definition it fails the full witness of Scripture.",
        "tone-register",
        "medium",
        "Replace academic 'corpus' with book-native wording.",
        "'Corpus' is accurate but register-breaking. The revision better matches the book's scriptural vocabulary.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/06-knowing-faith-love-and-belief.adoc",
        "Jesus says it without remainder: __“If ye love me, keep my commandments”__ (John 14:15).",
        "Jesus says it plainly: __“If ye love me, keep my commandments”__ (John 14:15).",
        "tone-register",
        "low",
        "Replace abstract phrase 'without remainder'.",
        "'Without remainder' is precise but mathematical. 'Plainly' lowers the parse burden.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/08-the-name.adoc",
        "Now watch how the true marriage is enacted, because the mechanics carry the meaning.",
        "The true marriage is enacted through the same covenant mechanics.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now watch' transition.",
        "The new sentence keeps the argument but removes the narrator's stage cue.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/08-the-name.adoc",
        "Mark where Ruth’s wedding under the wing led, because it closes this chapter’s circle.",
        "Ruth’s wedding under the wing leads directly into this chapter’s closing point.",
        "ai-sounding-staging",
        "medium",
        "Replace imperative transition.",
        "The revision keeps the connective tissue while reducing the recurring 'Mark...' command pattern.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/09-the-seal.adoc",
        "Mark what this makes of the sixth-seal scene, for the winds and the sealing are one element.",
        "This clarifies the sixth-seal scene, for the winds and the sealing are one element.",
        "ai-sounding-staging",
        "medium",
        "Replace stage-direction wording.",
        "The revised sentence says what the observation does without commanding the reader to mark it.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/11-marriage-and-divorce.adoc",
        "Hold that no-return rule; the whole gospel will hang on it before this chapter ends.",
        "The no-return rule matters because the whole gospel will hang on it before this chapter ends.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Hold that' cue.",
        "The revision retains the forward promise but removes a repeated presenter command.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/11-marriage-and-divorce.adoc",
        "The bill of divorce is the exile — the wife sent __“out of his house,”__ scattered among the nations — and God holds the paperwork up to her children (Isaiah 50:1).",
        "The bill of divorce is the exile — the wife sent __“out of his house,”__ scattered among the nations — and God holds that bill up to her children (Isaiah 50:1).",
        "tone-register",
        "medium",
        "Replace casual 'paperwork'.",
        "'Paperwork' is modern and slightly comic in a solemn paragraph. 'That bill' keeps the legal image already present.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/12-wings.adoc",
        "Because the English keeps changing, the reader who works only in English never sees the thread — which is why this chapter matters beyond its size.",
        "Because the English keeps changing, the reader who works only in English can miss the thread.",
        "ai-sounding-staging",
        "medium",
        "Cut self-justifying chapter meta-comment.",
        "The chapter does not need to explain why it matters; the evidence can carry that weight.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/13-orphans-widows-and-the-fatherless.adoc",
        "This is the turn.",
        "Here the symbol turns.",
        "ai-sounding-staging",
        "medium",
        "Replace clipped stage cue.",
        "The revision names what is turning instead of using a generic dramatic beat.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/13-orphans-widows-and-the-fatherless.adoc",
        "Why should an empty wallet inherit a kingdom?",
        "Why should the poor inherit a kingdom?",
        "bad-metaphor",
        "medium",
        "Replace casual metaphor with direct theological term.",
        "'Empty wallet' is vivid but too modern and flippant for the surrounding argument.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/14-the-remnant.adoc",
        "Now watch every other line of evidence come in on the same mark.",
        "Every other line of evidence comes in on the same mark.",
        "ai-sounding-staging",
        "medium",
        "Remove 'Now watch' cue.",
        "The sentence works without the presenter command.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/14-the-remnant.adoc",
        "Read that last row again, because it turns the whole hard saying inside out.",
        "That last row turns the whole hard saying inside out.",
        "ai-sounding-staging",
        "medium",
        "Remove direct reading instruction.",
        "The line keeps the interpretive claim and drops the directive.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/14-the-remnant.adoc",
        "Applied to a world of eight billion, that is on the order of *seventeen million people* — roughly one in a hundred and twenty of those who profess the faith; spread across the world's millions of congregations, fewer than a handful in each, and they are not spread evenly.",
        "Applied to a world of eight billion, that is on the order of *seventeen million people* — roughly one in five hundred people worldwide, or about one in one hundred forty professing Christians if measured against 2.4 billion; spread across the world's millions of congregations, fewer than a handful in each, and they are not spread evenly.",
        "factual-math",
        "high",
        "Clarify denominator in remnant ratio.",
        "Seventeen million out of eight billion is about one in 470; seventeen million out of 2.4 billion is about one in 140. The current 'one in a hundred and twenty' depends on a smaller Christian denominator and should be made explicit or corrected.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/16-shadow.adoc",
        "Now watch whose shadow the righteous live in.",
        "The righteous live under a different shadow.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now watch' transition.",
        "The revision makes the point directly and avoids a repeated AI-presenter cadence.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/17-justice-and-judgment.adoc",
        "And when God writes His own résumé, this is it:",
        "And when God names His own works, this is it:",
        "tone-register",
        "medium",
        "Replace modern résumé metaphor.",
        "The metaphor is memorable but risks sounding glib. The revision fits the biblical register better.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/18-liberty.adoc",
        "No slaver releases his stock by market forces; only a decree from above the slaver sets the captive walking home.",
        "No slaver releases his captives by persuasion or pressure; only a decree from above the slaver sets them walking home.",
        "bad-metaphor",
        "medium",
        "Replace market metaphor in slavery image.",
        "'Market forces' imports an economic idiom that competes with the Exodus/legal image.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/18-liberty.adoc",
        "The offer of freedom from God’s rule is the serpent’s original sales pitch, and it has never once delivered: the man who escapes the law of liberty does not walk free, he walks back into the slaver’s house.",
        "The offer of freedom from God’s rule is the serpent’s original lie, and it has never once delivered: the man who escapes the law of liberty does not walk free, he walks back into the slaver’s house.",
        "tone-register",
        "medium",
        "Replace modern sales idiom.",
        "'Sales pitch' is a sharp line but sounds modern and casual. 'Lie' is simpler and scripturally native.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/19-the-fool-and-the-wise.adoc",
        "Hold that, and the parable of the ten virgins opens, for it is built of symbols already defined.",
        "With that definition in place, the parable of the ten virgins opens, for it is built of symbols already defined.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Hold that' cue.",
        "The revision keeps the logic while thinning the repeated command pattern.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/22-the-fear-of-the-lord.adoc",
        "Weigh what the feared man actually is:",
        "The feared man is:",
        "ai-sounding-staging",
        "low",
        "Replace imperative setup.",
        "The shorter line lets the quoted text do the work.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "Jesus came to explain the law and everything He taught can be found in the Old Testament.",
        "Jesus came to explain the law, and everything He taught can be found in the Old Testament.",
        "grammar",
        "low",
        "Add comma between independent clauses.",
        "This is a small grammar/readability correction.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "Jesus’ role as our High Priest is defined by the Old Testament law that clearly identifies that willfully and defiantly ignoring the law is blaspheming the LORD (aka grieving the spirit of grace).",
        "Jesus’ role as our High Priest is defined by the Old Testament law that clearly identifies willfully and defiantly ignoring the law as blaspheming the LORD — that is, grieving the spirit of grace.",
        "tone-register",
        "medium",
        "Replace 'aka' and smooth syntax.",
        "'Aka' is too casual for the book's register, and the double 'that' makes the sentence harder to parse.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "Stop sinning!",
        "Stop sinning.",
        "tone-register",
        "medium",
        "Remove lone exclamation point.",
        "The exclamation breaks the book's otherwise restrained print tone.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "The typical three step path to salvation is:",
        "The typical three-step path to salvation is:",
        "grammar",
        "low",
        "Hyphenate compound modifier.",
        "Standard copyedit.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        ". Confess that Jesus is Lord (Master) and Call on Him for Salvation",
        ". Confess that Jesus is Lord (Master) and call on Him for salvation",
        "grammar",
        "low",
        "Normalize capitalization in list item.",
        "The current capital letters look accidental inside a sentence-style list.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "You cannot accept the second step without believing the law provides a High Priest, demands a sacrifice, and prophecies of a Messiah, and that Jesus meets the requirements of the law and prophets.",
        "You cannot accept the second step without believing that the law provides a High Priest, demands a sacrifice, and prophesies of a Messiah, and that Jesus meets the requirements of the law and the prophets.",
        "grammar",
        "high",
        "Fix 'prophecies' used as a verb.",
        "'Prophecies' is a noun; this sentence needs the verb 'prophesies.'",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "If you aspire to be a Christian, a __“like-Christ”__, then your aim is to be like Him, to walk as He walked, and to do nothing unless we see the Father, the LORD, doing so or commanding so, as it is written in the Old and New Testaments.",
        "If you call yourself Christian, then your aim is to be like Christ: to walk as He walked, and to do nothing unless you see the Father, the LORD, doing or commanding it, as written in the Old and New Testaments.",
        "readability",
        "medium",
        "Smooth awkward definition of Christian.",
        "'A like-Christ' is hard to parse, and the sentence shifts from 'your' to 'we.'",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "This chapter went into great depth to highlight that salvation depends upon confessing that the law (of the LORD via Moses and the Prophets) is good.",
        "The point is this: salvation depends upon confessing that the law of the LORD, given through Moses and the Prophets, is good.",
        "ai-sounding-staging",
        "medium",
        "Remove chapter self-summary phrasing.",
        "'This chapter went into great depth' sounds like a report about the chapter rather than the chapter speaking.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "Confessing Jesus to be Lord means He is your Master and that your desire and will is to do nothing Jesus hasn’t commanded you.",
        "Confessing Jesus as Lord means He is your Master, and that your desire is to do nothing Jesus has not commanded.",
        "grammar",
        "medium",
        "Fix agreement and tighten sentence.",
        "'Your desire and will is' is grammatically rough, and 'has not' fits the print register better than the contraction.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "If that is the desire of your mind and heart then you will do your best to keep the law of the LORD even if you occasionally sin.",
        "If that is the desire of your mind and heart, then you will do your best to keep the law of the LORD, even if you occasionally sin.",
        "grammar",
        "low",
        "Add commas for readability.",
        "The sentence parses more cleanly with the conditional and concessive clauses marked.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/23-path-to-salvation.adoc",
        "Our salvation is not a result of works which means no one can boast they are saved because of their works.",
        "Our salvation is not the result of works, which means no one can boast that he is saved because of his works.",
        "grammar",
        "medium",
        "Fix comma and pronoun clarity.",
        "The sentence needs a comma before the nonrestrictive clause, and the final phrase reads more cleanly with an explicit subject.",
        "C004",
    ),
    Proposal(
        "books/symbolic-language/24-what-is-the-point.adoc",
        "Now mark what kind of case that is: not a point at all, but a letter — a letter the promise itself guards.",
        "The case is not a point at all, but a letter — a letter the promise itself guards.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now mark' cue.",
        "The revised sentence carries the same argument without the repeated command cadence.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/24-what-is-the-point.adoc",
        "Mark what the command is for: __“that ye may keep the commandments”__ — the fence against adding exists for the sake of obedience, the same stake this chapter set at its start.",
        "The command exists __“that ye may keep the commandments”__ — the fence against adding exists for the sake of obedience, the same stake this chapter set at its start.",
        "ai-sounding-staging",
        "medium",
        "Replace imperative transition.",
        "This keeps the interpretation and removes the instruction to the reader.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/25-spoken-once-heard-twice.adoc",
        "Small examples first, so the mechanism is proven before it carries weight; the big readings will each be earned in their place.",
        "The small examples establish the mechanism before the larger readings carry it further.",
        "ai-sounding-staging",
        "medium",
        "Remove meta-comment about argument strategy.",
        "The original narrates the persuasion strategy. The revision is less self-conscious.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/27-behold-the-hand.adoc",
        "Hold that rule, and now spell the Name.",
        "With that rule in place, spell the Name.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Hold that' cue.",
        "The revision keeps the transition but reduces the stage-command pattern.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/27-behold-the-hand.adoc",
        "Mark what that path does not do: it breaks no bone.",
        "That path breaks no bone.",
        "ai-sounding-staging",
        "medium",
        "Replace imperative setup.",
        "The shorter line is clearer and stronger.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/27-behold-the-hand.adoc",
        "Weigh what this layer is, and what it is not.",
        "This layer must be weighed carefully: what it is, and what it is not.",
        "ai-sounding-staging",
        "low",
        "Replace direct command with statement.",
        "This preserves the caution but makes it less presenter-like.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/28-sun-moon-and-stars.adoc",
        "Hold that mark: a perfect and complete gift bears *no shadow of turning* — it will divide the true sign from the counterfeit when the counterfeit appears.",
        "That mark matters: a perfect and complete gift bears *no shadow of turning* — it will divide the true sign from the counterfeit when the counterfeit appears.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Hold that' cue.",
        "The revision keeps the signpost without repeating the command pattern.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/28-sun-moon-and-stars.adoc",
        "Weigh what the word testifies: the throne stands to the sun as the *wife* stands to her *husband* — the _ezer ke-negdo_, the helper who is his counterpart and mate.",
        "The word testifies that the throne stands to the sun as the *wife* stands to her *husband* — the _ezer ke-negdo_, the helper who is his counterpart and mate.",
        "ai-sounding-staging",
        "low",
        "Replace imperative setup.",
        "The line becomes declarative and easier to enter.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/29-lucifers-declared-plan.adoc",
        "Hold that identity, for every line of the plan runs on it.",
        "That identity governs every line of the plan.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Hold that' cue.",
        "The revision is tighter and less self-conscious.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/29-lucifers-declared-plan.adoc",
        "_Moed_ is one of the most load-bearing words in the Torah: the *appointed times* — __“the feasts (_moedim_) of the LORD, which ye shall proclaim to be holy convocations”__ (Leviticus 23:2); the lights of the fourth day were hung __“for signs, and for seasons (_moedim_)”__ (Genesis 1:14); the moon appointed for the seasons (Psalm 104:19); the tabernacle itself is the _ohel moed_, the tent of *meeting* — of the appointed time.",
        "_Moed_ is one of the central words in the Torah: the *appointed times* — __“the feasts (_moedim_) of the LORD, which ye shall proclaim to be holy convocations”__ (Leviticus 23:2); the lights of the fourth day were hung __“for signs, and for seasons (_moedim_)”__ (Genesis 1:14); the moon appointed for the seasons (Psalm 104:19); the tabernacle itself is the _ohel moed_, the tent of *meeting* — of the appointed time.",
        "tone-register",
        "low",
        "Replace modern 'load-bearing'.",
        "'Load-bearing' is a useful workshop metaphor but sounds modern and slightly technical here.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/30-the-pearl.adoc",
        "Mark what the verse does not say: there is no __“and”__ between the new moon and the full moon — one day, not two.",
        "The verse does not say __“and”__ between the new moon and the full moon — one day, not two.",
        "ai-sounding-staging",
        "medium",
        "Replace imperative transition.",
        "The revised sentence keeps the point and drops the command.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/31-the-sabbath.adoc",
        "Now watch the count expose a paradox — and mark what its solution must look like.",
        "The count exposes a paradox — and its solution must meet the text exactly.",
        "ai-sounding-staging",
        "medium",
        "Replace stacked stage commands.",
        "This removes both 'watch' and 'mark' while keeping the argumentative turn.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/34-the-fall-of-babylon.adoc",
        "The sym:sym-mountain[mountain] that destroyed all the earth is rolled down and burned (Jeremiah 51:25); the millstone goes under; the music stops mid-note (Revelation 18:22).",
        "The sym:sym-mountain[mountain] that destroyed all the earth is rolled down and burned (Jeremiah 51:25); the millstone goes under; the music stops (Revelation 18:22).",
        "bad-metaphor",
        "low",
        "Remove decorative 'mid-note'.",
        "The added image is poetic but does not clarify the point.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/37-the-moment.adoc",
        "Mark what actually changes hands in that moment, for it is not what the devil was holding.",
        "What changes hands in that moment is not what the devil was holding.",
        "ai-sounding-staging",
        "medium",
        "Replace imperative setup.",
        "The revision is direct and keeps the contrast.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/38-mountain.adoc",
        "Another verse that is poetic on the surface, but carries a far more practical message once you read it through the lens of the Bible’s Symbolic Language:",
        "Another verse sounds poetic on the surface, but carries a far more practical message when read by Scripture’s own symbols:",
        "tone-register",
        "medium",
        "Replace lens metaphor and title self-reference.",
        "The revision avoids a stock metaphor and reduces self-branding inside the argument.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/38-mountain.adoc",
        "Then, those who are not caught as fish will be hunted down from among the nations, in every city, and out of every bunker.",
        "Then, those who are not caught as fish will be hunted down from among the nations, in every city, and out of every hiding place.",
        "tone-register",
        "medium",
        "Replace modern 'bunker'.",
        "'Bunker' is vivid but modern; 'hiding place' keeps the image broader and less jarring.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/38-mountain.adoc",
        "The contrast is the whole point: AI does not interpret Scripture for us, and it must not be trusted to — but the meaning is already there, recoverable by anyone, or anything, willing to follow the method rather than lean on inherited opinion.",
        "The contrast matters: AI does not interpret Scripture for us, and it must not be trusted to — but the meaning is already there, recoverable by anyone, or anything, willing to follow the method rather than lean on inherited opinion.",
        "ai-sounding-staging",
        "low",
        "Soften emphatic meta-claim.",
        "'The whole point' is a repeated summarizing cadence. 'Matters' is calmer.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/39-sea-and-waters.adoc",
        "We will investigate all of these uses in this chapter and then explore how they can help us gain deeper insights into verses most often read over as mere poetic “fluff”.",
        "This chapter gathers those uses and shows how they clarify verses often read as mere poetic ornament.",
        "tone-register",
        "medium",
        "Replace first-person roadmap and casual 'fluff'.",
        "The revision is shorter, more book-like, and removes a register slip.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/39-sea-and-waters.adoc",
        "Keep that sym:sym-wind[wind] in mind; we will come back to it.",
        "That sym:sym-wind[wind] returns later in the chapter.",
        "ai-sounding-staging",
        "medium",
        "Replace 'keep that in mind' cue.",
        "The revised sentence makes the connection without a presenter instruction.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/39-sea-and-waters.adoc",
        "Now watch where kingdoms come from.",
        "The next texts show where kingdoms come from.",
        "ai-sounding-staging",
        "medium",
        "Replace 'Now watch' cue.",
        "This keeps the transition and drops the stage direction.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/39-sea-and-waters.adoc",
        "Read that slowly: he sat in the sea, and the multitude stood on the land.",
        "The scene is precise: he sat in the sea, and the multitude stood on the land.",
        "ai-sounding-staging",
        "medium",
        "Replace direct reading instruction.",
        "The revised line preserves the observation and removes the command to the reader.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/40-trees.adoc",
        "Two more branches of the symbol, before the beasts.",
        "Two more branches of the symbol remain before the beasts.",
        "ai-sounding-staging",
        "low",
        "Smooth fragmentary roadmap.",
        "The revision removes the clipped director's-note feel.",
        "C001",
    ),
    Proposal(
        "books/symbolic-language/43-the-bow.adoc",
        "That reach is the hinge of everything that follows.",
        "That reach governs what follows.",
        "ai-sounding-staging",
        "low",
        "Replace grand hinge metaphor.",
        "The revision is simpler and less inflated.",
        "C001",
    ),
]


CAMPAIGNS = {
    "C001": (
        "AI Cadence And Register",
        "Repeated presenter cues, modern idioms, and sentence-level phrases that make the prose sound AI-polished or over-managed.",
    ),
    "C002": (
        "Antithesis And Epigram Thinning",
        "Book-wide thinning of repeated 'not X but Y' formulas and minted one-line section closers. These need chapter-level judgment, not blind replacement.",
    ),
    "C003": (
        "Prevalence Table Sourcing",
        "Tables with estimated percentages need a source note, research trail, or softened language so the numbers do not look invented.",
    ),
    "C004": (
        "Readability Grammar And Factual Checks",
        "Local grammar, math, and rough-parse issues that can usually be handled with one-line patches.",
    ),
    "C005": (
        "Long Sentence Triage",
        "Very long prose sentences should be reviewed in context; many are defensible, but the top candidates add avoidable parse load.",
    ),
}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def ensure_clean_out() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "previews").mkdir(parents=True)
    (OUT / "patches").mkdir(parents=True)
    (OUT / "campaigns").mkdir(parents=True)
    (OUT / "scans").mkdir(parents=True)


def find_line(file_rel: str, old: str) -> tuple[int, list[str]]:
    path = ROOT / file_rel
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    for i, line in enumerate(lines, start=1):
        if line.rstrip("\n") == old:
            return i, lines
    raise ValueError(f"Could not find exact source line in {file_rel}: {old[:80]!r}")


def context_for(lines: list[str], line_no: int, radius: int = 2) -> str:
    start = max(1, line_no - radius)
    end = min(len(lines), line_no + radius)
    out = []
    for n in range(start, end + 1):
        prefix = ">" if n == line_no else " "
        out.append(f"{prefix} {n}: {lines[n - 1].rstrip()}")
    return "\n".join(out)


def write_patch(issue_id: str, p: Proposal, line_no: int, lines: list[str]) -> str:
    old_lines = [line.rstrip("\n") for line in lines]
    new_lines = list(old_lines)
    new_lines[line_no - 1] = p.new
    diff = difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile=f"a/{p.file}",
        tofile=f"b/{p.file}",
        lineterm="",
    )
    patch = "\n".join(diff) + "\n"
    path = OUT / "patches" / f"{issue_id}.diff"
    path.write_text(patch, encoding="utf-8")
    return rel(path)


def write_preview(issue_id: str, p: Proposal, line_no: int, lines: list[str], patch_path: str) -> str:
    path = OUT / "previews" / f"{issue_id}.md"
    preview = f"""# {issue_id}

Status: pending
Scope: {p.scope}
Type: {p.type}
Severity: {p.severity}
Campaign: {p.campaign}
File: `{p.file}`
Location: line {line_no}

## Summary

{p.summary}

## Current

```adoc
{p.old}
```

## Proposed

```adoc
{p.new}
```

## Rationale

{p.rationale}

## Context

```text
{context_for(lines, line_no)}
```

## Patch

`{patch_path}`
"""
    path.write_text(preview, encoding="utf-8")
    return rel(path)


def chapter_files() -> list[Path]:
    return sorted(
        p
        for p in BOOK.glob("*.adoc")
        if re.match(r"^\d", p.name) and "draft" not in p.name
    )


def strip_blocks(text: str) -> str:
    return "\n".join(line for _, line in prose_lines_with_numbers(text))


def prose_lines_with_numbers(text: str) -> list[tuple[int, str]]:
    lines = text.splitlines()
    out: list[str] = []
    in_front = bool(lines and lines[0].strip() == "---")
    in_quote = False
    for n, line in enumerate(lines, start=1):
        if in_front:
            if n != 1 and line.strip() == "---":
                in_front = False
            continue
        if line.strip() == "____":
            in_quote = not in_quote
            continue
        if in_quote:
            continue
        if line.startswith("[quote") or line.startswith("image::") or line.startswith("|"):
            continue
        out.append((n, line))
    return out


def write_scan_files() -> None:
    files = chapter_files()

    with (OUT / "scans" / "em-dash-density.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["file", "words", "em_dashes", "em_dashes_per_1000_words"])
        for path in files:
            text = strip_blocks(path.read_text(encoding="utf-8"))
            words = len(re.findall(r"\b[\w’']+\b", text))
            dashes = text.count("—")
            rate = round(dashes * 1000 / words, 2) if words else 0
            writer.writerow([rel(path), words, dashes, rate])

    trigger_rx = re.compile(
        r"\b(Now watch|Hold that|Read that|Mark what|Weigh what|Keep that|This is the turn|whole point|through the lens|failure mode|load-bearing|sales pitch|paperwork|fluff|bunker|corpus)\b",
        re.IGNORECASE,
    )
    with (OUT / "scans" / "trigger-phrases.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["file", "line", "trigger", "text"])
        for path in files:
            for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
                m = trigger_rx.search(line)
                if m:
                    writer.writerow([rel(path), n, m.group(0), line.strip()])

    antithesis_rx = re.compile(r"\bnot\s+.{1,80}\bbut\b|\bnot merely\b|\bnot only\b|\bnot simply\b|\bnot just\b", re.IGNORECASE)
    with (OUT / "scans" / "antithesis-candidates.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["file", "line", "text"])
        for path in files:
            for n, line in prose_lines_with_numbers(path.read_text(encoding="utf-8")):
                if antithesis_rx.search(line):
                    writer.writerow([rel(path), n, line.strip()])

    with (OUT / "scans" / "prevalence-tables.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["file", "line", "nearby_title"])
        for path in files:
            lines = path.read_text(encoding="utf-8").splitlines()
            for n, line in enumerate(lines, start=1):
                if ".prevalence-table" in line:
                    title = ""
                    for back in range(n - 1, max(0, n - 6), -1):
                        if lines[back - 1].startswith("."):
                            title = lines[back - 1]
                            break
                    writer.writerow([rel(path), n, title])

    sentence_rows: list[tuple[int, str, int, str]] = []
    for path in files:
        prose = prose_lines_with_numbers(path.read_text(encoding="utf-8"))
        paragraphs: list[tuple[int, list[str]]] = []
        current: list[str] = []
        start_line = 0
        for n, line in prose:
            if line.strip():
                if not current:
                    start_line = n
                current.append(line)
            elif current:
                paragraphs.append((start_line, current))
                current = []
                start_line = 0
        if current:
            paragraphs.append((start_line, current))
        for para_start, para_lines in paragraphs:
            para = " ".join(line.strip() for line in para_lines if line.strip())
            if not para or para.startswith("[") or para.startswith("="):
                continue
            for sentence in re.split(r"(?<=[.!?])\s+", para):
                words = re.findall(r"\b[\w’']+\b", sentence)
                if len(words) >= 65:
                    sentence_rows.append((len(words), rel(path), para_start, sentence))
    sentence_rows.sort(reverse=True)
    with (OUT / "scans" / "long-sentences.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["words", "file", "approx_line", "sentence"])
        for row in sentence_rows[:80]:
            writer.writerow(row)


def write_campaigns() -> None:
    for cid, (title, desc) in CAMPAIGNS.items():
        path = OUT / "campaigns" / f"{cid.lower()}-{re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')}.md"
        path.write_text(
            f"""# {cid}: {title}

Status: pending
Scope: systematic

## Problem

{desc}

## Review Approach

Do not apply this globally by search and replace. Use the scan CSVs to locate candidates, then approve localized patches or mark passages as intentionally retained.

## Supporting Scans

- `../scans/trigger-phrases.csv`
- `../scans/antithesis-candidates.csv`
- `../scans/em-dash-density.csv`
- `../scans/prevalence-tables.csv`
- `../scans/long-sentences.csv`
""",
            encoding="utf-8",
        )


def main() -> None:
    ensure_clean_out()
    write_scan_files()
    write_campaigns()

    rows: list[dict[str, str]] = []
    for idx, proposal in enumerate(PROPOSALS, start=1):
        issue_id = f"MEAT-{idx:04d}"
        line_no, lines = find_line(proposal.file, proposal.old)
        patch_path = write_patch(issue_id, proposal, line_no, lines)
        preview_path = write_preview(issue_id, proposal, line_no, lines, patch_path)
        rows.append(
            {
                "id": issue_id,
                "status": "pending",
                "scope": proposal.scope,
                "type": proposal.type,
                "severity": proposal.severity,
                "file": proposal.file,
                "start_line": str(line_no),
                "end_line": str(line_no),
                "summary": proposal.summary,
                "patch_path": patch_path,
                "preview_path": preview_path,
                "campaign": proposal.campaign,
                "original_hash": hash_text(proposal.old),
                "reviewer_notes": "",
                "decided_at": "",
                "applied_at": "",
                "apply_error": "",
            }
        )

    for cid, (title, desc) in CAMPAIGNS.items():
        issue_id = f"MEAT-C{cid[-3:]}"
        campaign_path = next((OUT / "campaigns").glob(f"{cid.lower()}-*.md"))
        rows.append(
            {
                "id": issue_id,
                "status": "pending",
                "scope": "systematic",
                "type": "campaign",
                "severity": "medium",
                "file": "",
                "start_line": "",
                "end_line": "",
                "summary": title,
                "patch_path": "",
                "preview_path": rel(campaign_path),
                "campaign": cid,
                "original_hash": "",
                "reviewer_notes": "",
                "decided_at": "",
                "applied_at": "",
                "apply_error": "",
            }
        )

    csv_path = OUT / "issues.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        fieldnames = [
            "id",
            "status",
            "scope",
            "type",
            "severity",
            "file",
            "start_line",
            "end_line",
            "summary",
            "patch_path",
            "preview_path",
            "campaign",
            "original_hash",
            "reviewer_notes",
            "decided_at",
            "applied_at",
            "apply_error",
        ]
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    summary = f"""# Initial Editorial Audit Data

Generated from the current `books/symbolic-language/*.adoc` manuscript files.

## Counts

- Localized proposed patches: {len(PROPOSALS)}
- Systematic campaign rows: {len(CAMPAIGNS)}
- Total CSV rows: {len(rows)}

## Files

- `issues.csv` is the control ledger.
- `previews/` contains one human-readable before/after/rationale page per localized issue.
- `patches/` contains one candidate unified diff per localized issue.
- `campaigns/` contains broader review plans that should not be applied blindly.
- `scans/` contains raw machine-readable scan data for triage.

## Important

No manuscript file was changed by this generator. The patches are proposals only.

## Basic Review Tool

Use `../review.py` from this generated folder, or run it from the repository root:

```bash
books/symbolic-language/editorial-review/review.py status
books/symbolic-language/editorial-review/review.py ui
books/symbolic-language/editorial-review/review.py next
books/symbolic-language/editorial-review/review.py accept --note "cleaner"
books/symbolic-language/editorial-review/review.py reject --note "keep original voice"
books/symbolic-language/editorial-review/review.py current
books/symbolic-language/editorial-review/review.py notes --preview
books/symbolic-language/editorial-review/review.py list --status pending --limit 20
books/symbolic-language/editorial-review/review.py show MEAT-0021
books/symbolic-language/editorial-review/review.py accept MEAT-0021 --note "math fix"
books/symbolic-language/editorial-review/review.py reject MEAT-0007
books/symbolic-language/editorial-review/review.py apply --dry-run
books/symbolic-language/editorial-review/review.py apply --yes
```

Useful filters:

```bash
books/symbolic-language/editorial-review/review.py list --campaign C001 --severity medium
books/symbolic-language/editorial-review/review.py list --grep "failure mode"
books/symbolic-language/editorial-review/review.py notes --grep "source" --preview
```

For normal review, start with `review.py ui`. It shows one issue at a time and
uses single-key actions:

```text
a accept       r reject       w needs rewrite       f fact-check
m note         n/Enter next   b back                v full preview
g goto         s search       t compact/context    q quit
[/] context    ? help
```

The default UI view shows before/after context from the manuscript file. The
old line is marked `-`, the proposed line is marked `+`, and changed words
inside those lines are highlighted red/green while unchanged words stay plain.
Use `--context N` to choose the starting number of neighboring lines,
`--compact` to start with the shorter current/proposed view, and `--color never`
if your terminal does not handle ANSI color well.

The `next` command stores a current issue in `.review-state.json` inside the
selected audit folder. If you run `accept`, `reject`, `rewrite`, `factcheck`, or
`pending` without an issue ID, the command acts on that current issue and then
shows the next pending item. Use `--no-next` to mark the current item without
advancing.

The apply command tries the stored patch first. If nearby accepted edits have
made the patch context stale, it falls back to replacing the exact `Current`
preview text with the exact `Proposed` preview text, but only when the current
text occurs exactly once in the target file. Ambiguous fallbacks fail closed.
Use `--no-fallback` for strict patch-only behavior.
"""
    (OUT / "README.md").write_text(summary, encoding="utf-8")
    print(f"Wrote {rel(OUT)}")
    print(f"Localized proposals: {len(PROPOSALS)}")
    print(f"Campaigns: {len(CAMPAIGNS)}")


if __name__ == "__main__":
    main()
