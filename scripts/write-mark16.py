#!/usr/bin/env python3
import json

data = {
  "book": "Mark",
  "chapter": 16,
  "source": "Marqu - The Hebrew Gospel of Mark v1.2",
  "note": "Verses 3-5 appear merged in the source text (v3 contains content from v4-5). The colophon at end of v20 reads: 'Here end the chapters of Matthew 54 and the chapters of Mark 16.'",
  "verses": [
    {
      "verse": 1,
      "translation": "And when the Shabbat{H7676} had passed{H5674}, Miryam{H4813} of Magdala and Miryam{H4813} the mother{H517} of Ya'aqov{H3290} and Shlomi bought{H7069} costly{H4030} ointment{H4888}, in order to anoint{H4886} Yeshua{H3442}.",
      "words": [
        ["\u05d5\u05db\u05d0\u05e9\u05e8", "H834", "and when"],
        ["\u05d4\u05e9\u05d1\u05ea", "H7676", "the Shabbat"],
        ["\u05e2\u05d1\u05e8\u05d4", "H5674", "had passed"],
        ["\u05de\u05e8\u05d9\u05dd", "H4813", "Miryam"],
        ["\u05de\u05d2\u05d3\u05dc\u05d9\u05ea", "", "of Magdala"],
        ["\u05d5\u05de\u05e8\u05d9\u05dd", "H4813", "and Miryam"],
        ["\u05d0\u05dd", "H517", "mother of"],
        ["\u05d9\u05e2\u05e7\u05d1", "H3290", "Ya'aqov"],
        ["\u05d5\u05e9\u05dc\u05d5\u05de\u05d9", "", "and Shlomi"],
        ["\u05e7\u05e0\u05d5", "H7069", "bought"],
        ["\u05de\u05e9\u05d9\u05d7\u05d4", "H4888", "ointment"],
        ["\u05de\u05e8\u05d2\u05dc\u05d9\u05d9\u05ea", "H4030", "costly"],
        ["\u05d1\u05e2\u05d1\u05d5\u05e8", "H5668", "in order"],
        ["\u05e9\u05ea\u05de\u05e9\u05d7\u05d5", "H4886", "to anoint"],
        ["\u05d9\u05e9\u05d5\u05e2", "H3442", "Yeshua"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05de\u05e9\u05d9\u05d7\u05d4 \u05de\u05e8\u05d2\u05dc\u05d9\u05d9\u05ea (meshichah margaliit \u2014 'costly ointment', H4888+H4030). The word \u05de\u05e9\u05d9\u05d7\u05d4 (meshichah) is from the same root as \u05de\u05e9\u05d9\u05d7 (mashiach \u2014 'Messiah/Anointed'). The women come to 'anoint' (\u05dc\u05de\u05e9\u05d5\u05d7, limshoch) the Anointed One (\u05de\u05e9\u05d9\u05d7). This wordplay is visible only in Hebrew. Greek has \u1f00\u03c1\u03ce\u03bc\u03b1\u03c4\u03b1 ('spices') \u2014 no connection to Christos.",
          "Uses \u05de\u05e8\u05d2\u05dc\u05d9\u05d9\u05ea (margaliit \u2014 'precious/costly', H4030) \u2014 the same root as \u05de\u05e8\u05d2\u05dc\u05d9\u05d5\u05ea (margaliyot \u2014 'pearls', used for precious things). Greek \u1f00\u03c1\u03ce\u03bc\u03b1\u03c4\u03b1 doesn't convey preciousness."
        ],
        "greek_deviations": [
          "Greek adds \u1f35\u03bd\u03b1 \u1f10\u03bb\u03b8\u03bf\u1fe6\u03c3\u03b1\u03b9 \u1f00\u03bb\u03b5\u03af\u03c8\u03c9\u03c3\u03b9\u03bd \u03b1\u1f50\u03c4\u03cc\u03bd ('that they might come and anoint him') making the purpose more explicit. Hebrew uses \u05d1\u05e2\u05d1\u05d5\u05e8 \u05e9\u05ea\u05de\u05e9\u05d7\u05d5 ('in order to anoint')."
        ],
        "translation_notes": [
          "The mashiach/meshichah wordplay: the women bring anointing-oil (\u05de\u05e9\u05d9\u05d7\u05d4) to anoint (\u05dc\u05de\u05e9\u05d5\u05d7) the Anointed One (\u05de\u05e9\u05d9\u05d7)."
        ],
        "textual_notes": []
      }
    },
    {
      "verse": 2,
      "translation": "And they came{H935} to visit in the morning{H1242}, the day after, at the tomb{H6913}, and the sun{H8121} had already come out{H3318}.",
      "words": [
        ["\u05d5\u05d1\u05d0\u05d5", "H935", "and they came"],
        ["\u05dc\u05d1\u05e7\u05e8", "H1239", "to visit"],
        ["\u05de", "", "from"],
        ["\u05de\u05d7\u05e8\u05ea", "H4283", "the day after"],
        ["\u05d1\u05e7\u05e8", "H1242", "in the morning"],
        ["\u05d1\u05e7\u05d1\u05e8", "H6913", "at the tomb"],
        ["\u05d5\u05db\u05d1\u05e8", "", "and already"],
        ["\u05d9\u05e6\u05d0", "H3318", "came out"],
        ["\u05d4\u05e9\u05de\u05e9", "H8121", "the sun"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05dc\u05d1\u05e7\u05e8 (levaqer \u2014 'to visit/inspect', from H1239 baqar \u2014 'to seek/inquire'). Greek \u1f14\u03c1\u03c7\u03bf\u03bd\u03c4\u03b1\u03b9 ('they come'). The Hebrew adds a specific PURPOSE to the visit \u2014 levaqer implies an inspection/inquiry visit, not a casual arrival. A back-translator from 'they come' would use \u05d1\u05d0\u05d5 alone."
        ],
        "greek_deviations": [
          "Hebrew: 'the day after, in the morning.' Greek: '\u03bb\u03af\u03b1\u03bd \u03c0\u03c1\u03c9\u0390 ('very early'). Hebrew uses \u05de\u05d7\u05e8\u05ea ('the morrow') \u2014 a specific time reference."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 3,
      "translation": "And they said{H559} among themselves: Who{H4310} shall roll{H1556} for us the stone{H68} at the tomb{H6913}? They saw{H7200} that it sat{H3427} to the right{H3225} side \u2014 a certain young man{H5288} clothed{H3847} in a white{H3836} garment{H899} \u2014 and they were afraid{H3372}.",
      "words": [
        ["\u05d5\u05d0\u05d5\u05de\u05e8\u05d5\u05ea", "H559", "and saying"],
        ["\u05d1\u05d9\u05e0\u05d9\u05d4\u05df", "", "among themselves"],
        ["\u05de\u05d9", "H4310", "who"],
        ["\u05d9\u05e9\u05dc\u05d9\u05da", "H1556", "shall roll"],
        ["\u05dc\u05e0\u05d5", "", "for us"],
        ["\u05d4\u05d0\u05d1\u05df", "H68", "the stone"],
        ["\u05d1\u05e7\u05d1\u05e8", "H6913", "at the tomb"],
        ["\u05e8\u05d0\u05d5", "H7200", "they saw"],
        ["\u05e9\u05d1\u05ea", "H3427", "sitting"],
        ["\u05d1\u05e6\u05d3", "H6654", "at the side"],
        ["\u05d9\u05de\u05d9\u05df", "H3225", "right"],
        ["\u05e0\u05e2\u05e8", "H5288", "a young man"],
        ["\u05d0\u05d7\u05d3", "H259", "one"],
        ["\u05de\u05dc\u05d5\u05d1\u05e9", "H3847", "clothed"],
        ["\u05d1\u05d2\u05d3", "H899", "in a garment"],
        ["\u05d0\u05d7\u05d3", "H259", "one"],
        ["\u05dc\u05d1\u05df", "H3836", "white"],
        ["\u05d5\u05e0\u05e4\u05d7\u05d3\u05d5", "H6342", "and they were afraid"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05d9\u05e9\u05dc\u05d9\u05da (yashlik \u2014 'shall roll/cast away', from H1556 galal \u2014 'to roll'). Actually the form suggests H7993 shalak ('to cast/throw'). Greek \u1f00\u03c0\u03bf\u03ba\u03c5\u03bb\u03af\u03c3\u03b5\u03b9 ('will roll away'). The Hebrew verb is more forceful \u2014 'cast away' vs. 'roll away.'",
          "The source text merges Greek vv3-5 into a single verse. The women's question about the stone, their seeing the young man, and their fear are compressed together, suggesting a different narrative rhythm than the Greek."
        ],
        "greek_deviations": [
          "Hebrew merges Greek vv3-5 (the question about the stone, seeing it rolled away, entering the tomb, and seeing the young man) into a single compressed narrative unit. Greek separates these into distinct sequential actions."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 6,
      "translation": "And he said{H559} to them: Do not fear{H3372}! You sought{H1245} Yeshua{H3442} the Nazarite{H5141} who was hung{H8518}. He is not here{H6311}. See{H7200} this place{H4725} where they placed{H3240} him.",
      "words": [
        ["\u05d5\u05d4\u05d5\u05d0", "", "and he"],
        ["\u05d0\u05de\u05e8", "H559", "said"],
        ["\u05dc\u05d4\u05df", "", "to them"],
        ["\u05d0\u05dc", "H408", "do not"],
        ["\u05ea\u05e4\u05d7\u05d3\u05d5", "H6342", "fear"],
        ["\u05d0\u05ea\u05dd", "H859", "you"],
        ["\u05d1\u05e7\u05e9\u05ea\u05dd", "H1245", "sought"],
        ["\u05d9\u05e9\u05d5\u05e2", "H3442", "Yeshua"],
        ["\u05e0\u05e6\u05e8\u05d9", "H5141", "the Nazarite"],
        ["\u05e9\u05e0\u05ea\u05dc\u05d4", "H8518", "who was hung"],
        ["\u05d0\u05d9\u05e0\u05e0\u05d5", "", "he is not"],
        ["\u05e4\u05d4", "H6311", "here"],
        ["\u05e8\u05d0\u05d5", "H7200", "see"],
        ["\u05d6\u05d4", "H2088", "this"],
        ["\u05d4\u05de\u05e7\u05d5\u05dd", "H4725", "place"],
        ["\u05e9\u05d4\u05e0\u05d9\u05d7\u05d5\u05d4\u05d5", "H3240", "where they placed him"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05e9\u05e0\u05ea\u05dc\u05d4 (shenitlah \u2014 'who was hung', from H8518 talah). Greek has \u1f10\u03c3\u03c4\u03b1\u03c5\u03c1\u03c9\u03bc\u03ad\u03bd\u03bf\u03bd ('the crucified one'). Consistent with the entire Hebrew Mark, which uses the Torah hanging verb throughout, never a crucifixion term.",
          "Uses \u05e0\u05e6\u05e8\u05d9 (natsri \u2014 'the Nazarite') again \u2014 the triple-wordplay title (consecrated one / branch / Nazareth). Greek \u039d\u03b1\u03b6\u03b1\u03c1\u03b7\u03bd\u03cc\u03bd captures only geography."
        ],
        "greek_deviations": [
          "Greek adds \u1f20\u03b3\u03ad\u03c1\u03b8\u03b7 ('he is risen') \u2014 the explicit resurrection statement. Hebrew says only \u05d0\u05d9\u05e0\u05e0\u05d5 \u05e4\u05d4 ('he is not here'). The Hebrew is more enigmatic \u2014 absence rather than explicit resurrection."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 7,
      "translation": "Go{H1980} immediately to the disciples and to Kefa and say{H559} to them that he goes before them to the Galil{H1551} \u2014 there you shall see{H7200} him, as he said{H559} to you.",
      "words": [
        ["\u05dc\u05db\u05d5", "H1980", "go"],
        ["\u05ea\u05db\u05e3", "H8233", "immediately"],
        ["\u05dc\u05ea\u05dc\u05de\u05d9\u05d3\u05d9\u05dd", "", "to the disciples"],
        ["\u05d5\u05dc\u05db\u05d9\u05e4\u05d0", "", "and to Kefa"],
        ["\u05d5\u05d0\u05de\u05e8\u05d5", "H559", "and say"],
        ["\u05dc\u05d4\u05dd", "", "to them"],
        ["\u05db\u05d9", "H3588", "that"],
        ["\u05dc\u05e4\u05e0\u05d9\u05d4\u05dd", "H6440", "before them"],
        ["\u05d1\u05d2\u05dc\u05d9\u05dc\u05d4", "H1551", "in the Galil"],
        ["\u05e9\u05dd", "H8033", "there"],
        ["\u05ea\u05e8\u05d0\u05d5\u05d4\u05d5", "H7200", "you shall see him"],
        ["\u05db\u05d0\u05e9\u05e8", "H834", "as"],
        ["\u05d4\u05d5\u05d0", "", "he"],
        ["\u05d0\u05d5\u05de\u05e8", "H559", "said"],
        ["\u05dc\u05db\u05dd", "", "to you"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05ea\u05db\u05e3 (tekhef \u2014 'immediately/at once'). Greek has no equivalent urgency word here. The Hebrew adds an immediacy absent from Greek."
        ],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 8,
      "translation": "And they went out{H3318} and fled{H1272} from the tomb{H6913}, for their dread{H6343} was great, and they trembled{H7460}; and to no{H3808} man{H120} did they say{H559} a thing{H1697}.",
      "words": [
        ["\u05d5\u05d9\u05e6\u05d0\u05d5", "H3318", "and they went out"],
        ["\u05d5\u05d1\u05e8\u05d7\u05d5", "H1272", "and fled"],
        ["\u05de\u05df", "H4480", "from"],
        ["\u05d4\u05e7\u05d1\u05e8", "H6913", "the tomb"],
        ["\u05dc\u05e4\u05d9", "", "because"],
        ["\u05e9\u05d2\u05d3\u05dc\u05d4", "H1431", "was great"],
        ["\u05e4\u05d7\u05d3\u05ea\u05df", "H6343", "their dread"],
        ["\u05d5\u05e0\u05e8\u05e2\u05d3\u05d5\u05ea", "H7460", "and trembling"],
        ["\u05d5\u05dc\u05e9\u05d5\u05dd", "H3808", "and to no"],
        ["\u05d0\u05d3\u05dd", "H120", "person"],
        ["\u05dc\u05d0", "H3808", "not"],
        ["\u05d0\u05de\u05e8\u05d5", "H559", "did they say"],
        ["\u05d3\u05d1\u05e8", "H1697", "a thing"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05e4\u05d7\u05d3\u05ea\u05df (pachadtan \u2014 'their dread', from H6343 pachad \u2014 'dread/terror'). This is the same word as \u05e4\u05d7\u05d3 \u05d9\u05e6\u05d7\u05e7 (pachad yitschaq \u2014 'the Fear/Dread of Isaac', Gen 31:42,53) \u2014 a divine terror. Greek \u03c4\u03c1\u03cc\u03bc\u03bf\u03c2 \u03ba\u03b1\u03b9 \u1f14\u03ba\u03c3\u03c4\u03b1\u03c3\u03b9\u03c2 ('trembling and astonishment'). The Hebrew echoes the patriarchal 'Fear of Isaac' \u2014 an encounter with the divine that produces dread."
        ],
        "greek_deviations": [
          "Greek adds \u03ba\u03b1\u03b9 \u03bf\u1f50\u03b4\u03b5\u03bd\u03b9 \u03bf\u1f50\u03b4\u03ad\u03bd \u03b5\u1f36\u03c0\u03bf\u03bd, \u1f10\u03c6\u03bf\u03b2\u03bf\u1fe6\u03bd\u03c4\u03bf \u03b3\u03ac\u03c1 ('they said nothing to anyone, for they were afraid'). Hebrew similarly ends with silence but phrases it differently: 'to no person did they say a thing.'"
        ],
        "translation_notes": [],
        "textual_notes": [
          "Many scholars consider the original Greek Mark to end here at v8. The Hebrew text continues with the 'longer ending' (vv9-20), which may reflect an independent tradition."
        ]
      }
    },
    {
      "verse": 9,
      "translation": "And Yeshua{H3442}, when he returned{H7725} alive{H2416} on the first{H7223} day{H3117} in the morning{H1242}, appeared{H7200} first{H7223} to Miryam{H4813} of Magdala, from whom he had driven out{H1644} seven{H7651} demons{H7700}.",
      "words": [
        ["\u05d5\u05d9\u05e9\u05d5\u05e2", "H3442", "and Yeshua"],
        ["\u05db\u05d0\u05e9\u05e8", "H834", "when"],
        ["\u05d7\u05d6\u05e8", "H7725", "returned"],
        ["\u05d7\u05d9", "H2416", "alive"],
        ["\u05d9\u05d5\u05dd", "H3117", "day"],
        ["\u05e8\u05d0\u05e9\u05d5\u05df", "H7223", "first"],
        ["\u05d1\u05d1\u05e7\u05e8", "H1242", "in the morning"],
        ["\u05d4\u05d5\u05d0", "", "he"],
        ["\u05e0\u05e8\u05d0\u05d4", "H7200", "appeared"],
        ["\u05e8\u05d0\u05e9\u05d5\u05e0\u05d4", "H7223", "first"],
        ["\u05dc\u05de\u05e8\u05d9\u05dd", "H4813", "to Miryam"],
        ["\u05de\u05d2\u05d3\u05dc\u05d9\u05ea", "", "of Magdala"],
        ["\u05d0\u05d5\u05ea\u05d4", "", "her"],
        ["\u05e9\u05d4\u05d5\u05d0", "", "from whom he"],
        ["\u05d2\u05d5\u05e8\u05e9", "H1644", "drove out"],
        ["\u05e9\u05d1\u05e2\u05d4", "H7651", "seven"],
        ["\u05e9\u05d3\u05d9\u05dd", "H7700", "demons"]
      ],
      "notes": {
        "one_way_hebrew": [
          "CRITICAL: Uses \u05d7\u05d6\u05e8 \u05d7\u05d9 (chazar chai \u2014 'returned alive', H7725+H2416). Greek has \u1f00\u03bd\u03b1\u03c3\u03c4\u03ac\u03c2 ('having risen'). The Hebrew does NOT use a resurrection verb. Instead, it says he 'RETURNED ALIVE' \u2014 he went away (died) and came back (alive). This is a fundamentally different conceptual framing: return vs. rising. A back-translator from \u1f00\u03bd\u03b1\u03c3\u03c4\u03ac\u03c2 would use \u05e7\u05dd (qam \u2014 'rose') or \u05e0\u05e2\u05d5\u05e8 (ne'or \u2014 'awakened'), NOT \u05d7\u05d6\u05e8 \u05d7\u05d9.",
          "Uses \u05d2\u05d5\u05e8\u05e9 (gorash \u2014 'drove out/expelled', H1644). This is the verb used for expelling Adam from Eden (Gen 3:24), driving out the Canaanites (Ex 23:28,29,30,31, 33:2, 34:11), and Hagar's expulsion (Gen 21:10). Greek \u1f10\u03ba\u03b2\u03b5\u03b2\u03bb\u03ae\u03ba\u03b5\u03b9 ('had cast out') is more generic. The Hebrew echoes the Genesis/Exodus expulsion narratives."
        ],
        "greek_deviations": [
          "Hebrew: 'returned alive' (\u05d7\u05d6\u05e8 \u05d7\u05d9). Greek: 'having risen' (\u1f00\u03bd\u03b1\u03c3\u03c4\u03ac\u03c2). Return vs. resurrection \u2014 different conceptual frameworks."
        ],
        "translation_notes": [
          "'Returned alive' for chazar chai \u2014 preserving the Hebrew framing of death as departure and resurrection as return."
        ],
        "textual_notes": []
      }
    },
    {
      "verse": 10,
      "translation": "And she went{H1980} and told{H5046} the others who had been with Yeshua{H3442}, who were standing{H5975} grieving{H205} and sighing{H585} and weeping{H1058} and groaning.",
      "words": [
        ["\u05d5\u05d4\u05d9\u05d0", "", "and she"],
        ["\u05d4\u05dc\u05db\u05d4", "H1980", "went"],
        ["\u05d5\u05d4\u05d2\u05d9\u05d3\u05d4", "H5046", "and told"],
        ["\u05dc\u05d0\u05d7\u05e8\u05d9\u05dd", "H312", "the others"],
        ["\u05e9\u05e2\u05de\u05d3\u05d5", "H5975", "who stood"],
        ["\u05e2\u05dd", "H5973", "with"],
        ["\u05d9\u05e9\u05d5\u05e2", "H3442", "Yeshua"],
        ["\u05e9\u05e2\u05d5\u05de\u05d3\u05d9\u05dd", "H5975", "who were standing"],
        ["\u05d0\u05e0\u05d5\u05e0\u05d9\u05dd", "H205", "grieving"],
        ["\u05d5\u05d0\u05e0\u05d5\u05d7\u05d9\u05dd", "H585", "and sighing"],
        ["\u05d5\u05d1\u05d5\u05db\u05d9\u05dd", "H1058", "and weeping"],
        ["\u05d5\u05de\u05ea\u05d0\u05e0\u05d7\u05d9\u05dd", "", "and groaning"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses a FOUR-FOLD grief vocabulary: \u05d0\u05e0\u05d5\u05e0\u05d9\u05dd (\u2018grieving\u2019), \u05d0\u05e0\u05d5\u05d7\u05d9\u05dd (\u2018sighing\u2019, from H585 anachah), \u05d1\u05d5\u05db\u05d9\u05dd (\u2018weeping\u2019, H1058), \u05de\u05ea\u05d0\u05e0\u05d7\u05d9\u05dd (\u2018groaning\u2019). Greek has only \u03c0\u03b5\u03bd\u03b8\u03bf\u1fe6\u03c3\u03b9\u03bd \u03ba\u03b1\u03b9 \u03ba\u03bb\u03b1\u03af\u03bf\u03c5\u03c3\u03b9\u03bd ('mourning and weeping' \u2014 TWO terms). The Hebrew elaborates grief with four words; the Greek condenses to two. A back-translator from two Greek terms would not expand to four Hebrew terms."
        ],
        "greek_deviations": [
          "Hebrew: four grief terms. Greek: two grief terms."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 11,
      "translation": "They who heard{H8085} that he had returned{H7725} alive{H2416}, that she had seen{H7200} him, did not believe{H539}.",
      "words": [
        ["\u05d4\u05dd", "", "they"],
        ["\u05e9\u05e9\u05de\u05e2\u05d5", "H8085", "who heard"],
        ["\u05e9\u05d7\u05d6\u05e8", "H7725", "that he returned"],
        ["\u05d7\u05d9", "H2416", "alive"],
        ["\u05e9\u05d4\u05d9\u05d0", "", "that she"],
        ["\u05e8\u05d0\u05ea\u05d4\u05d5", "H7200", "had seen him"],
        ["\u05d5\u05dc\u05d0", "H3808", "and not"],
        ["\u05d4\u05d0\u05de\u05d9\u05e0\u05d5", "H539", "did they believe"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Again uses \u05d7\u05d6\u05e8 \u05d7\u05d9 (chazar chai \u2014 'returned alive') \u2014 consistent with v9. Greek \u03b6\u1ff6\u03bd\u03c4\u03b1 ('living/alive') is used but paired with different verbs. The Hebrew consistently frames the resurrection as 'returning alive.'"
        ],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 12,
      "translation": "And after this, he appeared{H7200} to two{H8147} disciples who were going{H1980} to a certain city{H5892}, in the form{H6755} of strangers{H1616}.",
      "words": [
        ["\u05d5\u05d0\u05d7\u05e8", "H310", "and after"],
        ["\u05d6\u05d4", "H2088", "this"],
        ["\u05d4\u05d5\u05d0", "", "he"],
        ["\u05e0\u05e8\u05d0\u05d4", "H7200", "appeared"],
        ["\u05dc\u05e9\u05e0\u05d9", "H8147", "to two"],
        ["\u05ea\u05dc\u05de\u05d9\u05d3\u05d9\u05dd", "", "disciples"],
        ["\u05e9\u05d4\u05d5\u05dc\u05db\u05d9\u05dd", "H1980", "who were going"],
        ["\u05dc\u05e2\u05d9\u05e8", "H5892", "to a city"],
        ["\u05d0\u05d7\u05ea", "H259", "one"],
        ["\u05d1\u05e6\u05d5\u05e8\u05ea", "H6755", "in the form of"],
        ["\u05d2\u05e8\u05d9\u05dd", "H1616", "strangers"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05d1\u05e6\u05d5\u05e8\u05ea \u05d2\u05e8\u05d9\u05dd (b'tsurat gerim \u2014 'in the form of strangers/sojourners', H6755+H1616). Greek has \u1f10\u03bd \u1f11\u03c4\u03ad\u03c1\u1fb3 \u03bc\u03bf\u03c1\u03c6\u1fc7 ('in another form'). Hebrew specifies he appeared as \u05d2\u05e8\u05d9\u05dd (gerim \u2014 'resident aliens/sojourners') \u2014 the specific OT category of non-Israelites living in Israel (Gen 23:4, Ex 12:19,49, Lev 19:33-34). The risen Yeshua appears as a ger \u2014 an alien/stranger in his own land. This echoes Abraham's self-description as \u05d2\u05e8 \u05d5\u05ea\u05d5\u05e9\u05d1 ('a stranger and sojourner', Gen 23:4). A back-translator from 'another form' would NOT specify 'strangers.'"
        ],
        "greek_deviations": [
          "Hebrew: 'in the form of strangers' (specific identity). Greek: 'in another form' (vague transformation)."
        ],
        "translation_notes": [
          "The Emmaus road appearance (Lk 24:13-35) is here compressed to one verse with a unique detail: Yeshua appeared as a ger."
        ],
        "textual_notes": []
      }
    },
    {
      "verse": 13,
      "translation": "And they went{H1980} and told{H5608} the other{H312} disciples, and they did not believe{H539}.",
      "words": [
        ["\u05d5\u05d4\u05dd", "", "and they"],
        ["\u05d4\u05dc\u05db\u05d5", "H1980", "went"],
        ["\u05d5\u05e1\u05e4\u05e8\u05d5\u05d4\u05d5", "H5608", "and told"],
        ["\u05dc\u05d0\u05d7\u05e8\u05d9\u05dd", "H312", "the other"],
        ["\u05ea\u05dc\u05de\u05d9\u05d3\u05d9\u05d5", "", "disciples"],
        ["\u05d5\u05d4\u05dd", "", "and they"],
        ["\u05dc\u05d0", "H3808", "not"],
        ["\u05d4\u05d0\u05de\u05d9\u05e0\u05d5", "H539", "did they believe"]
      ],
      "notes": {
        "one_way_hebrew": [],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 14,
      "translation": "And after the first{H7223} day{H3117}, when all{H3605} eleven{H259}{H6240} were sitting{H3427} at table{H7979} to eat{H398}, Yeshua{H3442} appeared{H7200} to them, to reproach their refusal and the hardness{H7186} of their heart{H3820}, for they had not believed{H539} those who saw{H7200} him when he returned{H7725} alive{H2416}.",
      "words": [
        ["\u05d5\u05d0\u05d7\u05e8", "H310", "and after"],
        ["\u05d9\u05d5\u05dd", "H3117", "day"],
        ["\u05d0'", "H259", "first"],
        ["\u05e9\u05d9\u05d5\u05e9\u05d1\u05d9\u05df", "H3427", "sitting"],
        ["\u05d1\u05e9\u05d5\u05dc\u05d7\u05df", "H7979", "at table"],
        ["\u05db\u05dc", "H3605", "all"],
        ["\u05d0\u05d7\u05d3", "H259", "eleven"],
        ["\u05e2\u05e9\u05e8", "H6240", ""],
        ["\u05dc\u05d0\u05db\u05d5\u05dc", "H398", "to eat"],
        ["\u05d9\u05e9\u05d5\u05e2", "H3442", "Yeshua"],
        ["\u05e0\u05e8\u05d0\u05d4", "H7200", "appeared"],
        ["\u05dc\u05d4\u05dd", "", "to them"],
        ["\u05dc\u05d4\u05d1\u05d7\u05d9\u05df", "", "to reproach"],
        ["\u05de\u05d9\u05d0\u05d5\u05e0\u05dd", "", "their refusal"],
        ["\u05d5\u05e7\u05d5\u05e9\u05d9", "H7186", "and the hardness of"],
        ["\u05dc\u05d1\u05dd", "H3820", "their heart"],
        ["\u05db\u05d9", "H3588", "for"],
        ["\u05d0\u05d5\u05ea\u05dd", "", "they"],
        ["\u05dc\u05d0", "H3808", "not"],
        ["\u05d4\u05d0\u05de\u05d9\u05e0\u05d5", "H539", "believed"],
        ["\u05dc\u05d0\u05d5\u05ea\u05dd", "", "those"],
        ["\u05e9\u05e8\u05d0\u05d5\u05d4\u05d5", "H7200", "who saw him"],
        ["\u05e9\u05d7\u05d6\u05e8", "H7725", "who returned"],
        ["\u05d7\u05d9", "H2416", "alive"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05de\u05d9\u05d0\u05d5\u05e0\u05dd (mi'unam \u2014 'their refusal') \u2014 a later Hebrew word for 'refusal/unwillingness.' Greek \u1f00\u03c0\u03b9\u03c3\u03c4\u03af\u03b1\u03bd ('unbelief/faithlessness'). Hebrew specifies active refusal; Greek names a state of unbelief. Different psychological framing.",
          "Third use of \u05d7\u05d6\u05e8 \u05d7\u05d9 ('returned alive') for the resurrection."
        ],
        "greek_deviations": [
          "Hebrew: 'after the first day' (\u05d0\u05d7\u05e8 \u05d9\u05d5\u05dd \u05d0'). Greek: \u1f55\u03c3\u03c4\u03b5\u03c1\u03bf\u03bd ('afterward/later'). Hebrew gives specific timing; Greek is vague."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 15,
      "translation": "And he said{H559} to them: Go{H1980} into all{H3605} the world and proclaim{H1875} the word{H1697} of the King{H4428} of Heaven{H8064} to every{H3605} creature{H1254}.",
      "words": [
        ["\u05d5\u05d0\u05de\u05e8", "H559", "and he said"],
        ["\u05dc\u05d4\u05dd", "", "to them"],
        ["\u05dc\u05db\u05d5", "H1980", "go"],
        ["\u05d1\u05db\u05dc", "H3605", "into all"],
        ["\u05d4\u05e2\u05d5\u05dc\u05dd", "", "the world"],
        ["\u05d3\u05e8\u05e9\u05d5", "H1875", "proclaim"],
        ["\u05d3\u05d1\u05e8", "H1697", "the word of"],
        ["\u05de\u05dc\u05da", "H4428", "the King of"],
        ["\u05d4\u05e9\u05de\u05d9\u05dd", "H8064", "Heaven"],
        ["\u05dc\u05db\u05dc", "H3605", "to every"],
        ["\u05d1\u05e8\u05d9\u05d4", "H1254", "creature"]
      ],
      "notes": {
        "one_way_hebrew": [
          "CRITICAL: Uses \u05d3\u05d1\u05e8 \u05de\u05dc\u05da \u05d4\u05e9\u05de\u05d9\u05dd (dvar melekh hashamayim \u2014 'the word of the King of Heaven'). Greek has \u03c4\u1f78 \u03b5\u1f50\u03b1\u03b3\u03b3\u03ad\u03bb\u03b9\u03bf\u03bd ('the gospel/good news'). The Hebrew uses a ROYAL DECREE metaphor \u2014 the message is a king's edict, not merely 'good news.' A back-translator from 'gospel' would use \u05d1\u05e9\u05d5\u05e8\u05d4 (besurah \u2014 'good news'), NOT 'the word of the King of Heaven.'",
          "Uses \u05d3\u05e8\u05e9\u05d5 (dirshu \u2014 'proclaim/seek/inquire', from H1875 darash). This is the root of \u05de\u05d3\u05e8\u05e9 (midrash). Greek \u03ba\u03b7\u03c1\u03cd\u03be\u03b1\u03c4\u03b5 ('preach/herald'). A back-translator from 'preach' would use \u05e7\u05e8\u05d0\u05d5 or \u05d4\u05db\u05e8\u05d9\u05d6\u05d5, not the study/inquiry verb darash.",
          "Uses \u05d1\u05e8\u05d9\u05d4 (beriyah \u2014 'creature/creation', from H1254 bara \u2014 'to create'). This is the Genesis 1 creation verb. Greek \u03ba\u03c4\u03af\u03c3\u03b9\u03c2 ('creation') is equivalent, but the Hebrew uses the specific divine creation verb that only God performs."
        ],
        "greek_deviations": [
          "Hebrew: 'the word of the King of Heaven' (royal decree). Greek: 'the gospel' (good news). Entirely different metaphorical frames."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 16,
      "translation": "The one who believes{H539} and is immersed{H2881} shall be saved{H3467}, and the one who does not believe{H539} shall be blotted out{H4229}.",
      "words": [
        ["\u05d0\u05d5\u05ea\u05d5", "", "the one"],
        ["\u05e9\u05d9\u05d0\u05de\u05d9\u05df", "H539", "who believes"],
        ["\u05d5\u05d9\u05d4\u05d9\u05d4", "H1961", "and shall be"],
        ["\u05d8\u05d1\u05d5\u05dc", "H2881", "immersed"],
        ["\u05d9\u05d4\u05d9\u05d4", "H1961", "shall be"],
        ["\u05e0\u05d5\u05e9\u05e2", "H3467", "saved"],
        ["\u05d5\u05d0\u05d5\u05ea\u05d5", "", "and the one"],
        ["\u05e9\u05dc\u05d0", "H3808", "who does not"],
        ["\u05d9\u05d0\u05de\u05d9\u05df", "H539", "believe"],
        ["\u05d9\u05de\u05d7\u05d4", "H4229", "shall be blotted out"]
      ],
      "notes": {
        "one_way_hebrew": [
          "CRITICAL: Uses \u05d9\u05de\u05d7\u05d4 (yimmacheh \u2014 'shall be blotted out', from H4229 machah \u2014 'to wipe/blot out'). This is the verb for blotting names from the Book of Life (Ex 32:32-33, Deut 9:14, 25:19, 29:19, Ps 69:28). Greek \u03ba\u03b1\u03c4\u03b1\u03ba\u03c1\u03b9\u03b8\u03ae\u03c3\u03b5\u03c4\u03b1\u03b9 ('shall be condemned'). A back-translator from 'condemned' would use \u05d9\u05d5\u05e8\u05e9\u05e2 ('shall be found guilty'), NOT the Book of Life erasure verb. The Hebrew implies that the unbeliever's name is erased from existence \u2014 far more severe than legal condemnation.",
          "Uses \u05d8\u05d1\u05d5\u05dc (tavul \u2014 'immersed', from H2881 taval \u2014 'to dip/immerse'). This is the OT verb for ritual immersion (Lev 14:6,16,51; Num 19:18; Ruth 2:14; 2 Kgs 5:14 \u2014 Naaman's sevenfold immersion). Greek \u03b2\u03b1\u03c0\u03c4\u03b9\u03c3\u03b8\u03b5\u03af\u03c2 ('baptized') derives from this Hebrew concept."
        ],
        "greek_deviations": [
          "Hebrew: 'shall be blotted out' (\u05d9\u05de\u05d7\u05d4, Book of Life terminology). Greek: 'shall be condemned' (\u03ba\u03b1\u03c4\u03b1\u03ba\u03c1\u03b9\u03b8\u03ae\u03c3\u03b5\u03c4\u03b1\u03b9, legal terminology). Erasure from existence vs. legal judgment."
        ],
        "translation_notes": [
          "'Blotted out' for yimmacheh \u2014 the Book of Life erasure verb. This is not mere condemnation but ontological erasure.",
          "'Immersed' for tavul \u2014 the OT ritual dipping verb, connecting to the Levitical purification system."
        ],
        "textual_notes": [
          "Exodus 32:32-33 \u2014 'If you will forgive their sin... but if not, blot me out (\u05de\u05d7\u05e0\u05d9) of your book which you have written. And YHWH said: Whoever has sinned against me, him will I blot out (\u05d0\u05de\u05d7\u05e0\u05d5) of my book.'"
        ]
      }
    },
    {
      "verse": 17,
      "translation": "And these wonders{H6381} shall those who believe{H539} perform: they shall heal{H7495} in my name{H8034} the demon-possessed, and they shall speak{H1696} diverse{H2487} tongues{H3956}.",
      "words": [
        ["\u05d5\u05d0\u05dc\u05d4", "H428", "and these"],
        ["\u05d4\u05e0\u05e4\u05dc\u05d0\u05d5\u05ea", "H6381", "wonders"],
        ["\u05d9\u05e2\u05e9\u05d5", "H6213", "shall do"],
        ["\u05d0\u05d5\u05ea\u05dd", "", "those"],
        ["\u05e9\u05d9\u05d0\u05de\u05d9\u05e0\u05d5", "H539", "who believe"],
        ["\u05d4\u05dd", "", "they"],
        ["\u05d9\u05e8\u05e4\u05d0\u05d5", "H7495", "shall heal"],
        ["\u05d1\u05e9\u05de\u05d9", "H8034", "in my name"],
        ["\u05d4\u05de\u05e9\u05d5\u05d8\u05e0\u05d9\u05dd", "", "the demon-possessed"],
        ["\u05d5\u05d9\u05d3\u05d1\u05e8\u05d5", "H1696", "and shall speak"],
        ["\u05d7\u05dc\u05d5\u05e3", "H2487", "diverse"],
        ["\u05dc\u05e9\u05d5\u05e0\u05d5\u05ea", "H3956", "tongues"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05d9\u05e8\u05e4\u05d0\u05d5 (yirap'u \u2014 'they shall heal', from H7495 rapha \u2014 'to heal'). Greek \u1f10\u03ba\u03b2\u03b1\u03bb\u03bf\u1fe6\u03c3\u03b9\u03bd ('they shall cast out'). Hebrew says HEAL the demonized; Greek says CAST OUT the demons. Different therapeutic approach \u2014 Hebrew sees it as healing a person; Greek sees it as expelling an entity.",
          "Uses \u05d7\u05dc\u05d5\u05e3 \u05dc\u05e9\u05d5\u05e0\u05d5\u05ea (chaluf leshonot \u2014 'diverse/changed tongues', H2487+H3956). \u05d7\u05dc\u05d5\u05e3 means 'exchange/change/substitute.' Greek \u03b3\u03bb\u03ce\u03c3\u03c3\u03b1\u03b9\u03c2 \u03ba\u03b1\u03b9\u03bd\u03b1\u1fd6\u03c2 ('new tongues'). Hebrew says 'changed tongues' (implying their own tongues are transformed); Greek says 'new tongues' (implying entirely new languages)."
        ],
        "greek_deviations": [
          "Hebrew: 'heal the demon-possessed.' Greek: 'cast out demons.' Healing vs. exorcism.",
          "Hebrew: 'diverse tongues.' Greek: 'new tongues.'"
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 18,
      "translation": "No{H3808} manner of beasts{H929} or venomous serpents{H5175} shall harm{H5142} them, and they shall lay{H3240} hands{H3027} on the sick{H2470} and they shall be healed{H7495}.",
      "words": [
        ["\u05e9\u05d5\u05dd", "", "no"],
        ["\u05de\u05d9\u05e0\u05d9", "", "manner of"],
        ["\u05d1\u05d4\u05de\u05d5\u05ea", "H929", "beasts"],
        ["\u05d5\u05e0\u05d7\u05e9\u05d9\u05dd", "H5175", "and serpents"],
        ["\u05d0\u05e8\u05e1\u05d9\u05d9\u05dd", "", "venomous"],
        ["\u05dc\u05d0", "H3808", "not"],
        ["\u05d9\u05d6\u05d9\u05e7\u05d5\u05dd", "H5142", "shall harm them"],
        ["\u05d5\u05d9\u05e0\u05d9\u05d7\u05d5", "H3240", "and they shall lay"],
        ["\u05d4\u05d9\u05d3\u05d9\u05dd", "H3027", "hands"],
        ["\u05e2\u05dc", "H5921", "on"],
        ["\u05d4\u05d7\u05d5\u05dc\u05d9\u05dd", "H2470", "the sick"],
        ["\u05d5\u05d9\u05e8\u05e4\u05d0\u05d5", "H7495", "and they shall be healed"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05d1\u05d4\u05de\u05d5\u05ea \u05d5\u05e0\u05d7\u05e9\u05d9\u05dd (behemot u'nechashim \u2014 'beasts and serpents'). Greek mentions only \u1f44\u03c6\u03b5\u03b9\u03c2 ('serpents') and \u03b8\u03b1\u03bd\u03ac\u03c3\u03b9\u03bc\u03cc\u03bd ('deadly thing [poison]'). Hebrew adds \u05d1\u05d4\u05de\u05d5\u05ea (behemot \u2014 'beasts', H929) which is absent from Greek. This is the word from Genesis 1:24-25 for land animals and from Job 40:15 for the great beast.",
          "Uses \u05d0\u05e8\u05e1\u05d9\u05d9\u05dd (arsiyim \u2014 'venomous/poisonous'). Greek \u03b8\u03b1\u03bd\u03ac\u03c3\u03b9\u03bc\u03cc\u03bd ('deadly') modifies a different object ('deadly thing'). Hebrew modifies the serpents directly."
        ],
        "greek_deviations": [
          "Hebrew: 'beasts and venomous serpents.' Greek: 'serpents and deadly poison.' Hebrew has animals; Greek has snakes and poison."
        ],
        "translation_notes": [],
        "textual_notes": [
          "Genesis 3:15 \u2014 'He shall crush your head, and you shall bruise his heel.' The promise of victory over the serpent extends to believers."
        ]
      }
    },
    {
      "verse": 19,
      "translation": "And our lord{H113} Yeshua{H3442} the Anointed{H4899}, after he spoke{H1696} to them, went up{H5927} to the heavens{H8064} and sits{H3427} at the right hand{H3225} of the Name{H8034}.",
      "words": [
        ["\u05d5\u05d0\u05d3\u05d5\u05e0\u05d9\u05e0\u05d5", "H113", "and our lord"],
        ["\u05d9\u05e9\u05d5\u05e2", "H3442", "Yeshua"],
        ["\u05de\u05e9\u05d9\u05d7", "H4899", "the Anointed"],
        ["\u05d0\u05d7\u05e8", "H310", "after"],
        ["\u05e9\u05d4\u05d5\u05d0", "", "he"],
        ["\u05d3\u05d1\u05e8", "H1696", "spoke"],
        ["\u05dc\u05d4\u05dd", "", "to them"],
        ["\u05e2\u05dc\u05d4", "H5927", "went up"],
        ["\u05dc\u05e9\u05de\u05d9\u05dd", "H8064", "to the heavens"],
        ["\u05d5\u05d9\u05d5\u05e9\u05d1", "H3427", "and sits"],
        ["\u05dc\u05d9\u05de\u05d9\u05df", "H3225", "at the right hand of"],
        ["\u05d4\u05e9\u05dd", "H8034", "the Name"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05dc\u05d9\u05de\u05d9\u05df \u05d4\u05e9\u05dd (limin hashem \u2014 'at the right hand of the Name'). Greek has \u1f10\u03ba \u03b4\u03b5\u03be\u03b9\u1ff6\u03bd \u03c4\u03bf\u1fe6 \u03b8\u03b5\u03bf\u1fe6 ('at the right hand of God'). Hebrew uses the reverential circumlocution 'the Name' (hashem) for God. A back-translator from 'God' would use \u05d0\u05dc\u05d4\u05d9\u05dd, not the Jewish reverential substitute.",
          "Uses \u05de\u05e9\u05d9\u05d7 (mashiach \u2014 'Anointed', H4899) \u2014 the native Hebrew anointing title. Greek \u03a7\u03c1\u03b9\u03c3\u03c4\u03cc\u03c2 is the Greek translation of this Hebrew concept."
        ],
        "greek_deviations": [
          "Hebrew: 'the right hand of the Name.' Greek: 'the right hand of God.' Reverential circumlocution vs. direct naming."
        ],
        "translation_notes": [],
        "textual_notes": [
          "Psalm 110:1 \u2014 'YHWH said to my Lord: Sit at my right hand (\u05e9\u05d1 \u05dc\u05d9\u05de\u05d9\u05e0\u05d9).' The ascension fulfills the Psalm."
        ]
      }
    },
    {
      "verse": 20,
      "translation": "And they went{H1980} into all{H3605} the world to proclaim{H1875} with the help{H5828} of the Name{H8034}, with good{H2896} words{H1697} and with wonders{H6381} that they performed.",
      "words": [
        ["\u05d5\u05d4\u05dd", "", "and they"],
        ["\u05d4\u05dc\u05db\u05d5", "H1980", "went"],
        ["\u05d1\u05db\u05dc", "H3605", "into all"],
        ["\u05d4\u05e2\u05d5\u05dc\u05dd", "", "the world"],
        ["\u05dc\u05d3\u05e8\u05d5\u05e9", "H1875", "to proclaim"],
        ["\u05d1\u05e2\u05d6\u05e8", "H5828", "with the help of"],
        ["\u05d4\u05e9\u05dd", "H8034", "the Name"],
        ["\u05e2\u05dd", "H5973", "with"],
        ["\u05d3\u05d1\u05e8\u05d9\u05dd", "H1697", "words"],
        ["\u05d8\u05d5\u05d1\u05d9\u05dd", "H2896", "good"],
        ["\u05d5\u05e2\u05dd", "H5973", "and with"],
        ["\u05e0\u05e4\u05dc\u05d0\u05d5\u05ea", "H6381", "wonders"],
        ["\u05e9\u05d9\u05e2\u05e9\u05d5", "H6213", "that they performed"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses \u05d1\u05e2\u05d6\u05e8 \u05d4\u05e9\u05dd (b'ezer hashem \u2014 'with the help of the Name') \u2014 a standard Jewish invocation formula still used today. Greek has \u03c4\u03bf\u1fe6 \u03ba\u03c5\u03c1\u03af\u03bf\u03c5 \u03c3\u03c5\u03bd\u03b5\u03c1\u03b3\u03bf\u1fe6\u03bd\u03c4\u03bf\u03c2 ('the Lord working with them'). The Hebrew uses the liturgical prayer formula; the Greek describes divine cooperation. A back-translator from Greek would not produce the specific Jewish invocation \u05d1\u05e2\u05d6\u05e8 \u05d4\u05e9\u05dd.",
          "Uses \u05d3\u05d1\u05e8\u05d9\u05dd \u05d8\u05d5\u05d1\u05d9\u05dd (devarim tovim \u2014 'good words', H1697+H2896). Greek has \u03c4\u1f78\u03bd \u03bb\u03cc\u03b3\u03bf\u03bd \u03b2\u03b5\u03b2\u03b1\u03b9\u03bf\u1fe6\u03bd\u03c4\u03bf\u03c2 ('confirming the word'). Hebrew has 'good words' (a general summary); Greek has 'confirming the word' (validating the message). Different descriptions of apostolic activity."
        ],
        "greek_deviations": [
          "Hebrew: 'with the help of the Name' (Jewish prayer formula). Greek: 'the Lord working with them' (theological description).",
          "Hebrew: 'with good words and wonders.' Greek: 'confirming the word with signs following.' Different descriptions of ministry."
        ],
        "translation_notes": [],
        "textual_notes": [
          "The colophon following this verse reads: 'Here end the chapters of Matthew 54 and the chapters of Mark 16.' This confirms the manuscript's awareness of its own structure and the canonical Gospel order."
        ]
      }
    }
  ],
  "chapter_notes": {
    "summary": "Mark 16 in Hebrew presents the resurrection and commissioning with several distinctive one-way markers. The most striking: (1) \u05d7\u05d6\u05e8 \u05d7\u05d9 (chazar chai \u2014 'returned alive') used THREE times (vv9,11,14) for the resurrection instead of any resurrection verb \u2014 framing death as departure and resurrection as return, a conceptual difference from Greek \u1f00\u03bd\u03b1\u03c3\u03c4\u03ac\u03c2; (2) \u05d3\u05d1\u05e8 \u05de\u05dc\u05da \u05d4\u05e9\u05de\u05d9\u05dd (v15) \u2014 'the word of the King of Heaven' where Greek has 'the gospel,' a royal-decree metaphor vs. good-news metaphor; (3) \u05d9\u05de\u05d7\u05d4 (v16) \u2014 'shall be blotted out' (the Book of Life erasure verb from Ex 32:32-33) where Greek has 'shall be condemned' \u2014 ontological erasure vs. legal judgment; (4) \u05d1\u05e6\u05d5\u05e8\u05ea \u05d2\u05e8\u05d9\u05dd (v12) \u2014 Yeshua appears 'in the form of strangers' (the OT sojourner category) where Greek has merely 'in another form'; (5) \u05d1\u05e2\u05d6\u05e8 \u05d4\u05e9\u05dd (v20) \u2014 the standard Jewish prayer formula 'with the help of the Name' where Greek has 'the Lord working with them'; (6) the mashiach/meshichah wordplay in v1 \u2014 women bring anointing-oil to anoint the Anointed One, visible only in Hebrew; (7) four-fold grief vocabulary (v10) vs. Greek's two terms; (8) \u05d9\u05e8\u05e4\u05d0\u05d5 (v17) \u2014 'heal' the demonized vs. Greek 'cast out' demons; (9) consistent use of \u05d4\u05e9\u05dd ('the Name') as reverential circumlocution. The chapter colophon confirms the manuscript's self-awareness as part of a canonical Gospel collection."
  }
}

with open('/Users/dlarimer/timetested/data/hg-chapters/Mark-16.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"Mark 16 written: {len(data['verses'])} verses")
