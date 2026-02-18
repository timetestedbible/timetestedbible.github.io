#!/usr/bin/env python3
import json

data = {
  "book": "Mark",
  "chapter": 15,
  "source": "Marqu - The Hebrew Gospel of Mark v1.2",
  "verses": [
    {
      "verse": 1,
      "translation": "And early{H1242} in the morning{H1242} the chief{H1419} priests{H3548} and the Torah-scholars and the elders{H2205} of the people{H5971} assembled{H622} to counsel{H6098}, and seized{H8610} him and bound{H7194} him and led{H3212} him before Pilat, and delivered{H4560} him to him.",
      "words": [
        ["ובקר", "H1242", "and early"],
        ["בקר", "H1242", "in the morning"],
        ["נתאספו", "H622", "assembled"],
        ["לעצה", "H6098", "to counsel"],
        ["גדולי", "H1419", "the chief of"],
        ["הכהנים", "H3548", "the priests"],
        ["והחכמים", "H2450", "and the scholars"],
        ["מאותתים", "", "of the Torah-signs"],
        ["וזקני", "H2205", "and the elders of"],
        ["העם", "H5971", "the people"],
        ["ותפשוהו", "H8610", "and seized him"],
        ["וקשרוהו", "H7194", "and bound him"],
        ["והוליכוהו", "H3212", "and led him"],
        ["לפני", "H6440", "before"],
        ["פילאט", "", "Pilat"],
        ["ומסרוהו", "H4560", "and delivered him"],
        ["לו", "", "to him"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses בקר בקר (boqer boqer — 'morning morning', H1242 doubled) — a Hebrew intensifying construction meaning 'very early in the morning' (cf. Isa 28:19, Ex 16:21). Greek has πρωΐ ('early'). A back-translator would use בבקר once, not the emphatic doubling.",
          "Uses וקשרוהו (vayiqsheruhu — 'and they bound him', from H7194 qashar — 'to bind/conspire'). The root קשר carries a double meaning: to bind physically AND to conspire (1 Kgs 15:27, 16:9, 2 Kgs 15:10). The priests who conspired (qashar) against him now bind (qashar) him — a Hebrew wordplay invisible in Greek."
        ],
        "greek_deviations": [
          "Greek has the chief priests 'held a consultation' (συμβούλιον ποιήσαντες). Hebrew has them 'assembled to counsel' (נתאספו לעצה) — a formal gathering."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 2,
      "translation": "And Pilat asked{H7592} him: Are you the king{H4428} of Yisrael{H3478}? And he answered{H6030} him: You say it.",
      "words": [
        ["ופילאט", "", "and Pilat"],
        ["שאלו", "H7592", "asked him"],
        ["אתה", "H859", "you"],
        ["מלך", "H4428", "king of"],
        ["ישראל", "H3478", "Yisrael"],
        ["והוא", "", "and he"],
        ["ענהו", "H6030", "answered him"],
        ["אתה", "H859", "you"],
        ["אומרו", "H559", "say it"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses מלך ישראל (melekh yisrael — 'king of Yisrael'). Greek has βασιλεὺς τῶν Ἰουδαίων ('king of the JEWS'). Hebrew preserves the covenantal title 'king of Yisrael'; Greek uses the Romanized 'king of the Jews.' A back-translator would use מלך היהודים."
        ],
        "greek_deviations": [
          "Hebrew: 'king of Yisrael.' Greek: 'king of the Jews.' Different political/theological framing."
        ],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 3,
      "translation": "And the chief{H1419} priests{H3548} accused{H3960} him of many{H7227} things{H1697}. And Pilat again{H5750} asked{H7592} him: Are you the king{H4428} of Yisrael{H3478}? And Yeshua{H3442} answered{H6030} and said{H559}: You say it. And the chief{H1419} priests{H3548} accuse him of many{H7227} matters.",
      "words": [
        ["וגדולי", "H1419", "and the chief of"],
        ["הכהנים", "H3548", "the priests"],
        ["הלשינוהו", "H3960", "accused him"],
        ["מכמה", "H4100", "of many"],
        ["דברים", "H1697", "things"],
        ["ופילאט", "", "and Pilat"],
        ["עוד", "H5750", "again"],
        ["שאלו", "H7592", "asked him"],
        ["אתה", "H859", "you are"],
        ["הוא", "H1931", "he"],
        ["מלך", "H4428", "king of"],
        ["ישראל", "H3478", "Yisrael"],
        ["וישוע", "H3442", "and Yeshua"],
        ["ענה", "H6030", "answered"],
        ["ואמר", "H559", "and said"],
        ["אתה", "H859", "you"],
        ["אומרו", "H559", "say it"],
        ["וגדולי", "H1419", "and the chief of"],
        ["הכהנים", "H3548", "the priests"],
        ["מלשינים", "H3960", "accusing"],
        ["אותו", "", "him"],
        ["מעניינים", "", "of matters"],
        ["רבים", "H7227", "many"]
      ],
      "notes": {
        "one_way_hebrew": [
          "Uses הלשינוהו (hilshinuhu — 'they informed against him', from H3960 lashan — 'to use the tongue/slander'). The root לשון means 'tongue.' Greek κατηγόρουν ('accused') is standard legal terminology. The Hebrew verb implies malicious speech."
        ],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 4,
      "translation": "And Pilat again{H5750} asked{H7592} him, saying{H559}: Why do you not answer{H6030} any{H335} thing{H1697} to those who accused you of so many things{H1697}?",
      "words": [
        ["ופילאט", "", "and Pilat"],
        ["עוד", "H5750", "again"],
        ["שואלו", "H7592", "asked him"],
        ["אומר", "H559", "saying"],
        ["למה", "H4100", "why"],
        ["אינך", "", "do you not"],
        ["עונה", "H6030", "answer"],
        ["אי זה", "H335", "any"],
        ["דבר", "H1697", "thing"],
        ["לאותן", "", "to those"],
        ["שהלשינו", "H3960", "who accused"],
        ["אותך", "", "you"],
        ["מכמה", "H4100", "of so many"],
        ["דברים", "H1697", "things"]
      ],
      "notes": {
        "one_way_hebrew": [],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 5,
      "translation": "Yeshua{H3442} did not answer{H6030} after that, and Pilat marveled{H6382}.",
      "words": [
        ["ישוע", "H3442", "Yeshua"],
        ["לא", "H3808", "not"],
        ["ענה", "H6030", "answered"],
        ["אחרי כן", "H310", "after that"],
        ["ופילאט", "", "and Pilat"],
        ["נפלא", "H6382", "marveled"]
      ],
      "notes": {
        "one_way_hebrew": [],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": ["Isaiah 53:7 — 'He was oppressed and afflicted, yet he did not open his mouth.' Yeshua's silence fulfills the Servant prophecy."]
      }
    },
    {
      "verse": 6,
      "translation": "And Pilat was accustomed{H5090} to release one{H259} prisoner at this feast{H2282}, whomever they asked{H7592}.",
      "words": [
        ["ופילאט", "", "and Pilat"],
        ["נוהג", "H5090", "was accustomed"],
        ["לתת", "H5414", "to release"],
        ["תפוש", "H8610", "prisoner"],
        ["אחד", "H259", "one"],
        ["בחג", "H2282", "at the feast"],
        ["זה", "H2088", "this"],
        ["אשד", "", "whomever"],
        ["שואלים", "H7592", "they ask"]
      ],
      "notes": {
        "one_way_hebrew": ["Uses חג (chag, H2282 — 'feast/pilgrimage festival') — the specific Torah term for the three pilgrimage festivals (Ex 23:14-17, Deut 16:16). Greek ἑορτή is more generic."],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 7,
      "translation": "And then he was holding{H2388} a certain man{H120} prisoner, whose name{H8034} was Bar-Aven, who in a certain quarrel had committed{H6213} murder{H7523}, and for the murder{H7523} was placed{H7760} in prison.",
      "words": [
        ["ואז", "H227", "and then"],
        ["הוא", "", "he"],
        ["מחזיק", "H2388", "was holding"],
        ["אדם", "H120", "a man"],
        ["אחד", "H259", "one"],
        ["תפוש", "H8610", "prisoner"],
        ["ששמו", "H8034", "whose name was"],
        ["בראבן", "", "Bar-Aven"],
        ["אותו", "", "that one"],
        ["שבתגר", "", "who in a quarrel"],
        ["אחד", "H259", "one"],
        ["עשה", "H6213", "committed"],
        ["רציחה", "H7523", "murder"],
        ["ובעבור", "H5668", "and because of"],
        ["הרציחה", "H7523", "the murder"],
        ["הושם", "H7760", "was placed"],
        ["במאסר", "", "in prison"]
      ],
      "notes": {
        "one_way_hebrew": ["CRITICAL: The name is בראבן (Bar-Aven). Greek has Βαραββᾶν (Barabbas — 'son of the father'). The Hebrew parses as בר-אבן (Bar-Aven — 'son of iniquity/wickedness'), from אָוֶן (aven, H205 — 'wickedness'). The released prisoner is 'the son of wickedness' while 'the Son of God' is condemned. A back-translator from Greek would write בר-אבא, not the morally loaded Bar-Aven."],
        "greek_deviations": ["Hebrew: Bar-Aven ('son of iniquity'). Greek: Barabbas ('son of the father').", "Hebrew: 'in a quarrel committed murder.' Greek: 'in the insurrection (στάσει) had committed murder.' Personal dispute vs. political uprising."],
        "translation_notes": [],
        "textual_notes": ["Hosea 10:8 calls idolatrous shrines אָוֶן (aven — 'wickedness'). The name Bar-Aven echoes prophetic condemnation."]
      }
    },
    {
      "verse": 8,
      "translation": "And the people{H5971} came{H935} and began{H2490} to ask{H1245} him, as he knew{H3045} that he would release to them one{H259} prisoner.",
      "words": [
        ["ובא", "H935", "and came"],
        ["העם", "H5971", "the people"],
        ["והתחיל", "H2490", "and began"],
        ["לבקשו", "H1245", "to ask him"],
        ["כמו", "", "as"],
        ["שהוא", "", "he"],
        ["יודע", "H3045", "knew"],
        ["שיתן", "H5414", "that he would give"],
        ["להם", "", "to them"],
        ["תפוש", "H8610", "prisoner"],
        ["אחד", "H259", "one"]
      ],
      "notes": {"one_way_hebrew": [], "greek_deviations": [], "translation_notes": [], "textual_notes": []}
    },
    {
      "verse": 9,
      "translation": "And Pilat answered{H6030} them and said{H559}: Do you desire{H2654} that I release to you the king{H4428} of the Yehudim{H3064}?",
      "words": [
        ["ופילאט", "", "and Pilat"],
        ["ענה", "H6030", "answered"],
        ["להם", "", "them"],
        ["ואמר", "H559", "and said"],
        ["תחפצו", "H2654", "do you desire"],
        ["שאניח", "H3240", "that I release"],
        ["לכם", "", "to you"],
        ["מלך", "H4428", "king of"],
        ["היהודים", "H3064", "the Yehudim"]
      ],
      "notes": {"one_way_hebrew": [], "greek_deviations": [], "translation_notes": [], "textual_notes": []}
    },
    {
      "verse": 10,
      "translation": "For he knew{H3045} that the chief{H5945} priests{H3548} had delivered{H4560} him because of envy{H7068}.",
      "words": [
        ["כי", "H3588", "for"],
        ["הוא", "", "he"],
        ["יודע", "H3045", "knew"],
        ["כי", "H3588", "that"],
        ["עליוני", "H5945", "the chief of"],
        ["הכהנים", "H3548", "the priests"],
        ["מסרוהו", "H4560", "delivered him"],
        ["לו", "", "to him"],
        ["בעבור", "H5668", "because of"],
        ["קנאה", "H7068", "envy"]
      ],
      "notes": {
        "one_way_hebrew": ["Uses קנאה (qin'ah, H7068 — 'envy/jealousy/zeal'). The same word for God's jealousy (Ex 20:5, 34:14) and Phinehas's zeal (Num 25:11). Greek φθόνον is purely negative. Hebrew קנאה is morally ambiguous — the priests' 'zeal' leads them to kill God's son."],
        "greek_deviations": [],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {
      "verse": 11,
      "translation": "And the governors warned{H2094} the people{H5971} to ask{H7592} that Bar-Aven be returned{H7725} to them.",
      "words": [
        ["וההגמונים", "", "and the governors"],
        ["הזהירו", "H2094", "warned"],
        ["העם", "H5971", "the people"],
        ["שישאלו", "H7592", "to ask"],
        ["בר אבן", "", "Bar-Aven"],
        ["שיחזור", "H7725", "be returned"],
        ["להם", "", "to them"]
      ],
      "notes": {
        "one_way_hebrew": [
          "DIFFERENT AGENTS: Hebrew says ההגמונים (ha-hegmonim — 'the governors', Roman officials) stirred up the crowd. Greek has οἱ ἀρχιερεῖς ('the chief priests'). Hebrew blames Roman authorities; Greek blames Jewish leaders.",
          "Uses הזהירו (hizhiru — 'warned/cautioned', from H2094 zahar — 'to warn/teach'). Greek ἀνέσεισαν ('stirred up'). Hebrew implies instruction; Greek implies mob agitation."
        ],
        "greek_deviations": ["Hebrew: 'the governors warned the people.' Greek: 'the chief priests stirred up the crowd.' Different agents and actions."],
        "translation_notes": [],
        "textual_notes": []
      }
    },
    {"verse":12,"translation":"And Pilat said{H559} to them again: What do you desire{H2654} that I do with the king{H4428} of the Yehudim{H3064}?","words":[["ופילאט","","and Pilat"],["אמר","H559","said"],["להם","","to them"],["פעם","H6471","time"],["אחרת","H312","another"],["מה","H4100","what"],["תחפצו","H2654","do you desire"],["שאעשה","H6213","that I do"],["ממלך","H4428","with the king of"],["היהודים","H3064","the Yehudim"]],"notes":{"one_way_hebrew":[],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":13,"translation":"And they cried out{H6817}: Hang{H8518} him!","words":[["והם","","and they"],["צעקו","H6817","cried out"],["תלהו","H8518","hang him"]],"notes":{"one_way_hebrew":["CRITICAL: Uses תלהו (talehu — 'hang him!', from H8518 talah — 'to hang'). Greek has σταύρωσον αὐτόν ('crucify him!'). The Hebrew uses the Torah term for execution by hanging (Deut 21:22-23, Gen 40:19,22, Esth 7:10). Deuteronomy 21:23 declares 'cursed of God is the hanged one' (קללת אלהים תלוי). A back-translator would transliterate or use צלב."],"greek_deviations":["Hebrew: 'hang him' (Torah vocabulary). Greek: 'crucify him' (Roman vocabulary)."],"translation_notes":[],"textual_notes":["Deuteronomy 21:22-23 — 'If a man has committed a sin worthy of death... and you hang him on a tree... for he who is hanged is cursed of God.'"]}},
    {"verse":14,"translation":"And Pilat said{H559} to them: And what evil{H7451} has he done{H6213} to you? And still they cry out{H6817}: Hang{H8518} him!","words":[["ופילאט","","and Pilat"],["אמר","H559","said"],["להם","","to them"],["ואי זו","H335","and what"],["רעה","H7451","evil"],["עשה","H6213","did he do"],["לכם","","to you"],["ועוד","H5750","and still"],["הם","","they"],["צועקים","H6817","cry out"],["תאלוהו","H8518","hang him"]],"notes":{"one_way_hebrew":[],"greek_deviations":["Hebrew: 'what evil has he done TO YOU?' (לכם). Greek omits the personal element."],"translation_notes":[],"textual_notes":[]}},
    {"verse":15,"translation":"And Pilat, desiring{H2654} to do the will{H7522} of the people{H5971}, released to them Bar-Aven and delivered{H4560} Yeshua{H3442} to them, beaten{H5221}, to put him to death{H4191}.","words":[["ופילאט","","and Pilat"],["חפץ","H2654","desiring"],["לעשות","H6213","to do"],["רצון","H7522","the will of"],["העם","H5971","the people"],["נתן","H5414","released"],["להם","","to them"],["בראבן","","Bar-Aven"],["ומסר","H4560","and delivered"],["להם","","to them"],["ישוע","H3442","Yeshua"],["מוכה","H5221","beaten"],["להמיתו","H4191","to put him to death"]],"notes":{"one_way_hebrew":["Uses רצון העם (retson ha'am — 'the will of the people', H7522). רצון is the OT word for God's will/favor (Ps 40:8, 143:10). Irony: Pilat does the 'will' of the people where he should do God's will. Greek τὸ ἱκανὸν ποιῆσαι ('to satisfy') lacks this theological irony."],"greek_deviations":["Hebrew: 'beaten' (מוכה). Greek: 'scourged' (φραγελλώσας, Roman loanword)."],"translation_notes":[],"textual_notes":["Isaiah 53:4-5 — 'smitten (מוכה) of God and afflicted.' The word מוכה echoes the Suffering Servant."]}},
    {"verse":16,"translation":"And [the horsemen] with the servants led{H5090} him to the hall{H1964} of the officer{H7860}, and the people{H5971} assembled{H622} there.","words":[["והפרשים","","the horsemen"],["עם","H5973","with"],["המשרתים","","the servants"],["נהגוהו","H5090","led him"],["להיכל","H1964","to the hall of"],["השוטר","H7860","the officer"],["ונתאסף","H622","and assembled"],["שם","H8033","there"],["העם","H5971","the people"]],"notes":{"one_way_hebrew":["Uses היכל השוטר (heikhal hashoter — 'the hall of the officer'). Greek has πραιτώριον ('Praetorium' — a Latin loanword). Hebrew uses native OT terms: היכל (H1964) and שוטר (H7860, the Israelite officer from Ex 5:6, Deut 16:18). A back-translator would transliterate 'Praetorium.'"],"greek_deviations":["Hebrew: 'the people assembled' (העם). Greek: 'the whole cohort' (ὅλην τὴν σπεῖραν). Civilian crowd vs. military unit."],"translation_notes":[],"textual_notes":[]}},
    {"verse":17,"translation":"And [they clothed{H3847} him] in purple{H713}, and placed{H7760} on his head{H7218} a crown{H5850} of thorns{H6975}.","words":[["וילבישוהו","H3847","and they clothed him"],["ארגמן","H713","purple"],["ושמו","H7760","and placed"],["בראשו","H7218","on his head"],["עטרה","H5850","a crown"],["אחת","H259","one"],["מקוצים","H6975","of thorns"]],"notes":{"one_way_hebrew":["Uses ארגמן (argaman, H713 — 'purple') — the specific Tabernacle/priestly purple (Ex 25:4, 26:1,31, 28:5,6). They mockingly dress him in the Tabernacle's own color.","Uses עטרה (atarah, H5850 — 'crown') — used for royal crowns (2 Sam 12:30, Esth 8:15) and glory (Prov 4:9, Isa 28:5, 62:3)."],"greek_deviations":[],"translation_notes":[],"textual_notes":["Genesis 3:18 — 'thorns and thistles (קוץ ודרדר) shall it bring forth for you.' The King wears the curse of the ground on his head."]}},
    {"verse":18,"translation":"And they began to greet him: The Name{H8034} save{H3467} you, king{H4428} of the Yehudim{H3064}!","words":[["והתחילו","H2490","and they began"],["לתת","H5414","to give"],["לו","","him"],["שלום","H7965","greeting"],["השם","H8034","the Name"],["יושיעך","H3467","save you"],["מלך","H4428","king of"],["היהודים","H3064","the Yehudim"]],"notes":{"one_way_hebrew":["CRITICAL: Uses השם יושיעך (hashem yoshiakha — 'the Name save you!'). Greek has χαῖρε ('Hail!'). The Hebrew is a PRAYER FORMULA invoking YHWH. The root ישע (yasha — 'save') is the root of Yeshua's name. The mockers unknowingly pray for YHWH's salvation upon 'YHWH-saves.' A back-translator from χαῖρε would use שמח ('rejoice'), not a salvation prayer."],"greek_deviations":["Hebrew: 'The Name save you!' (prayer formula). Greek: 'Hail!' (Roman salutation)."],"translation_notes":[],"textual_notes":["Ironic wordplay: ישוע (Yeshua = 'YHWH saves') is mocked with יושיעך ('may [YHWH] save you')."]}},
    {"verse":19,"translation":"And they struck{H5221} him on the head{H7218} with a reed{H7070}, and spat{H7556} in his face{H6440}, and knelt{H3766} and bowed{H6419} to him.","words":[["והכוהו","H5221","and they struck him"],["בראש","H7218","on the head"],["עם","H5973","with"],["קנה","H7070","a reed"],["אחד","H259","one"],["וירקו","H7556","and they spat"],["בפניו","H6440","in his face"],["וכורעים","H3766","and kneeling"],["ומתפללים","H6419","and praying to"],["אותו","","him"]],"notes":{"one_way_hebrew":["Uses ומתפללים (umitpalelim — 'and praying', from H6419 palal). Greek προσεκύνουν ('worshipped'). The Hebrew uses the PRAYER verb — they mockingly 'pray' to him. A back-translator would use משתחוים ('bowing down')."],"greek_deviations":[],"translation_notes":[],"textual_notes":["Isaiah 50:6 — 'I gave my back to the smiters... I did not hide my face from shame and spitting.'"]}},
    {"verse":20,"translation":"And when they had greatly{H3966} mocked{H3932} him, they stripped{H6584} the purple{H713} from him and clothed{H3847} him in his own garments{H4403} and led{H5090} him out to hang{H8518} him.","words":[["וכאשר","H834","and when"],["מאד","H3966","greatly"],["הלעיגוהו","H3932","they mocked him"],["הפשיטו","H6584","they stripped"],["לו","","from him"],["הארגמן","H713","the purple"],["והלבישו","H3847","and clothed"],["לו","","him"],["מלבושיו","H4403","his garments"],["ונהגוהו","H5090","and led him"],["לתלותו","H8518","to hang him"]],"notes":{"one_way_hebrew":["Uses הלעיגוהו (hil'iguhu — 'mocked him', from H3932 la'ag) — the word for mocking God's prophets (2 Chr 36:16)."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":21,"translation":"And they compelled{H597} a certain man{H120} who was passing{H5674} through that place{H4725}, whose name{H8034} was Shimon{H8095}, a servant{H5650} who came{H935} from his city{H5892} — [father of Aleksandros and Rufus] — to carry{H5375} his warp-and-woof.","words":[["ואנסו","H597","and they compelled"],["אדם","H120","a man"],["אחד","H259","one"],["שהיה","H1961","who was"],["עובר","H5674","passing"],["באותו","","through that"],["מקום","H4725","place"],["שהיה","H1961","whose was"],["שמו","H8034","name"],["שמעון","H8095","Shimon"],["עבד","H5650","a servant"],["שבא","H935","who came"],["מעירו","H5892","from his city"],["אב","H1","father of"],["אלכסנדרוס","","Aleksandros"],["ורופוס","","and Rufus"],["שישא","H5375","to carry"],["שתי וערב","","warp-and-woof"],["שלו","","his"]],"notes":{"one_way_hebrew":["CRITICAL: Uses שתי וערב (shti va'erev — 'warp and woof') for the cross. This is the Torah TEXTILE term for the vertical and horizontal threads of a loom (Lev 13:48,49,51,52,53,56,57,58,59). The cross is described through Levitical purity vocabulary. NO back-translator from σταυρός would EVER choose a weaving metaphor. This is one of the most distinctive one-way markers in the entire Hebrew Gospels.","Uses עבד (eved, H5650 — 'servant') for Simon. Greek has Κυρηναῖον ('a Cyrenian'). Hebrew identifies by social status; Greek by geography."],"greek_deviations":["Hebrew: 'a servant who came from his city.' Greek: 'Simon a Cyrenian coming from the countryside.'","Hebrew: 'warp-and-woof' (שתי וערב). Greek: 'cross' (σταυρός)."],"translation_notes":["'Warp-and-woof' for shti va'erev — the interlocking perpendicular threads of fabric."],"textual_notes":["Leviticus 13:48-59 uses שתי and ערב repeatedly in the laws of skin/fabric affliction. The execution instrument is described in the language of Levitical cleansing."]}},
    {"verse":22,"translation":"And they led{H5090} him to Gulgolta{H1538}: [which means Mon Kolori].","words":[["ונהגוהו","H5090","and they led him"],["בגולגולתא","H1538","to Gulgolta"],["שרצה לומר","","which means"],["מון קולורי","","Mon Kolori"]],"notes":{"one_way_hebrew":["Uses גולגולתא (Gulgolta) — from גלגלת (gulgolet, H1538 — 'skull'), used in the OT for census head-counts (Ex 16:16, Num 1:2,18). The Hebrew preserves the transparent meaning; Greek merely transliterates."],"greek_deviations":["Hebrew gloss: מון קולורי — Romance-language for 'Monte Calvario.' Greek gloss: Κρανίου Τόπος ('Place of the Skull'). The manuscript was used in a Sephardic community."],"translation_notes":[],"textual_notes":[]}},
    {"verse":23,"translation":"And they gave{H5414} him wine{H3196} of myrrh{H4753} to drink{H8354}, and he did not wish{H14} to drink{H8354}.","words":[["ונתנו","H5414","and they gave"],["לו","","him"],["לשתות","H8354","to drink"],["יין","H3196","wine"],["מור","H4753","myrrh"],["ולא","H3808","and not"],["רצה","H14","wished"],["לשתות","H8354","to drink"]],"notes":{"one_way_hebrew":[],"greek_deviations":[],"translation_notes":["מור (mor, H4753 — 'myrrh') — the same spice in the Tabernacle anointing oil (Ex 30:23). The Anointed One is offered the anointing spice in suffering."],"textual_notes":[]}},
    {"verse":24,"translation":"And when they hung{H8518} him, they divided{H2505} his garments{H4403} and cast{H3240} lots{H1486} upon them — who should take{H3947} each one.","words":[["וכאשר","H834","and when"],["תלוהו","H8518","they hung him"],["חלקו","H2505","they divided"],["מלבושיו","H4403","his garments"],["והניחו","H3240","and cast"],["גורלות","H1486","lots"],["עליהן","","upon them"],["אי זה","H335","who"],["יקח","H3947","shall take"],["כל","H3605","each"],["אחד","H259","one"],["מהם","","of them"]],"notes":{"one_way_hebrew":["Uses גורלות (goralot — 'lots', H1486 plural) — the Yom Kippur lot-casting word (Lev 16:8)."],"greek_deviations":[],"translation_notes":[],"textual_notes":["Psalm 22:18 — 'They divide my garments among them, and for my clothing they cast lots (יפילו גורל).'"]}},
    {"verse":25,"translation":"And it was the third{H7992} hour{H8160} when they hung{H8518} him.","words":[["והיתה","H1961","and it was"],["שעה","H8160","hour"],["שלישית","H7992","third"],["כאשר","H834","when"],["תלוהו","H8518","they hung him"]],"notes":{"one_way_hebrew":[],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":26,"translation":"And they placed{H3240} upon him a writing{H3791}: This is Yeshua{H3442} the Nazarite{H5139}, king{H4428} of the Yehudim{H3064}.","words":[["והניחו","H3240","and they placed"],["עליו","","upon him"],["כתב","H3791","a writing"],["זהו","H2088","this is"],["ישוע","H3442","Yeshua"],["נצרי","H5139","Nazarite"],["מלך","H4428","king of"],["היהודים","H3064","the Yehudim"]],"notes":{"one_way_hebrew":["Uses נצרי (natsri) — connecting to three Hebrew roots: (1) נָזִיר (nazir, H5139 — 'consecrated one'); (2) נֵצֶר (netser, H5342 — 'branch' from Isa 11:1); (3) נצרת (Nazareth). Greek Ναζωραῖος captures only geography."],"greek_deviations":["Hebrew includes 'Yeshua Nazarite' in the inscription. Greek Mark 15:26 has only 'The King of the Jews.'"],"translation_notes":[],"textual_notes":["Isaiah 11:1 — 'A shoot (נֵצֶר) shall come forth from the stump of Jesse.'"]}},
    {"verse":27,"translation":"And they hung{H8518} with him two{H8147} thieves{H1590}, one{H259} on the right{H3225} and one{H259} on the left{H8040}.","words":[["ותלו","H8518","and they hung"],["עמו","H5973","with him"],["שני","H8147","two"],["גנבים","H1590","thieves"],["אחד","H259","one"],["מימין","H3225","on the right"],["ואחד","H259","and one"],["משמאל","H8040","on the left"]],"notes":{"one_way_hebrew":["Uses גנבים (ganavim — 'thieves', H1590). Greek has λῃσταί ('bandits/insurrectionists'). Hebrew ganav is a petty thief (Ex 22:1-3); Greek lestes is a violent rebel."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":28,"translation":"Then the scripture{H3791} was fulfilled{H7999} which says{H559}: He was counted{H4487} among the wicked{H7563}.","words":[["אז","H227","then"],["היתה","H1961","was"],["נשלמת","H7999","fulfilled"],["הכתבה","H3791","the writing"],["שאומרת","H559","which says"],["הוא","","he"],["נמנה","H4487","was counted"],["עם","H5973","with"],["הרשעים","H7563","the wicked"]],"notes":{"one_way_hebrew":["From Isaiah 53:12. The Hebrew uses הרשעים ('the wicked', H7563) rather than Isaiah's פושעים ('transgressors'). Both native Hebrew, but the substitution suggests quoting from memory.","Uses נשלמת (nishlemet — 'fulfilled', from H7999 shalam — 'to complete/make peace'). Root שלם = שלום. Scripture is 'made-whole' by fulfillment."],"greek_deviations":[],"translation_notes":[],"textual_notes":["Isaiah 53:12 — '...he poured out his soul to death, and was numbered with the transgressors (ואת פושעים נמנה).'"]}},
    {"verse":29,"translation":"And those passing{H5674} by revile{H7043} him, shaking{H5128} their head{H7218}, saying{H559}: You were saying{H559} you would destroy{H2040} the sanctuary{H4720} of the Name{H8034}, and after three{H7969} days{H3117} you would build{H1129} it!","words":[["ואותם","","and those"],["שעוברים","H5674","passing by"],["שם","H8033","there"],["מקללים","H7043","reviling"],["אותו","","him"],["מניעים","H5128","shaking"],["ראשם","H7218","their head"],["אומרים","H559","saying"],["אתה","H859","you"],["היית","H1961","were"],["אומר","H559","saying"],["שתחריב","H2040","you would destroy"],["מקדש","H4720","the sanctuary of"],["השם","H8034","the Name"],["ואתה","H859","and you"],["אחר","H310","after"],["שלשת","H7969","three"],["ימים","H3117","days"],["תבנהו","H1129","would build it"]],"notes":{"one_way_hebrew":["Uses מקדש השם ('the sanctuary of the Name') — combining the Temple term with the reverential circumlocution for God. Greek just has τὸν ναόν ('the temple').","Uses מניעים ראשם ('shaking their head') — echoing Psalm 22:7 and Lamentations 2:15."],"greek_deviations":[],"translation_notes":[],"textual_notes":["Psalm 22:7 — 'All who see me mock me... they shake the head (יניעו ראש).'"]}},
    {"verse":30,"translation":"Save{H3467} yourself! Come down{H3381} from the warp-and-woof!","words":[["תושע","H3467","save"],["עצמך","","yourself"],["תרד","H3381","come down"],["מן","H4480","from"],["השתי וערב","","the warp-and-woof"]],"notes":{"one_way_hebrew":["The root ישע (yasha — 'save') is Yeshua's own name. The mockers demand that 'YHWH-saves' save himself.","Second occurrence of שתי וערב for the cross."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":31,"translation":"And likewise the chief{H5945} priests{H3548} said{H559} mockingly{H6711}, one{H259} to another{H259}, and with the other scribes{H5608}: Others he made saved{H3467}, and himself he cannot{H3201} save{H3467}!","words":[["וכמדומה לזה","","and likewise"],["עליוני","H5945","the chief of"],["הכהנים","H3548","the priests"],["אומרים","H559","saying"],["מצחקים","H6711","mocking"],["האחד","H259","one"],["עם","H5973","with"],["האחר","H259","another"],["ועם","H5973","and with"],["הסופרים","H5608","the scribes"],["האחרים","H312","others"],["עשה","H6213","he made"],["נושעים","H3467","saved"],["ועצמו","","and himself"],["אינו","","not"],["יכול","H3201","able"],["להושיע","H3467","to save"]],"notes":{"one_way_hebrew":["Uses מצחקים (metsachaqim — 'laughing', from H6711 tsachaq). Root of Isaac's name (יצחק). The priests 'laugh' at the true sacrifice — an ironic Genesis echo."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":32,"translation":"If you are the Messiah{H4899} of Yisrael{H3478}, come down{H3381} from the warp-and-woof, that we may see{H7200} and believe{H539} you! And those hung{H8518} with him make funeral-speeches{H5594}.","words":[["אם","H518","if"],["אתה","H859","you are"],["משיח","H4899","Messiah of"],["ישראל","H3478","Yisrael"],["רד","H3381","come down"],["מן","H4480","from"],["השתי וערב","","the warp-and-woof"],["שאנחנו","","that we"],["נראהו","H7200","may see"],["ונאמינך","H539","and believe you"],["ואותן","","and those"],["שהיו","H1961","who were"],["תלויים","H8518","hung"],["עמו","H5973","with him"],["עושים","H6213","make"],["הספדות","H5594","funeral-speeches"]],"notes":{"one_way_hebrew":["CRITICAL: Uses הספדות (hespadot — 'funeral speeches/eulogies', from H5594 safad — 'to mourn/eulogize'). Greek ὠνείδιζον ('reviled'). The thieves deliver MOCK FUNERAL ORATIONS for a man still alive — a uniquely Jewish form of mockery. A hesped is the formal eulogy at a funeral (Gen 23:2, 50:10; 2 Sam 1:12, 3:31; Zech 12:10). NO back-translator from 'reviled' would invent this.","Third occurrence of שתי וערב for the cross."],"greek_deviations":["Hebrew: thieves 'make funeral-speeches.' Greek: thieves 'reviled him.' Jewish mourning ritual vs. verbal abuse."],"translation_notes":["'Funeral-speeches' for hespadot — the formal Jewish eulogy genre, performed here as mockery."],"textual_notes":["Zechariah 12:10 — 'they shall mourn (וספדו) for him as one mourns for an only son.'"]}},
    {"verse":33,"translation":"And around the sixth{H8345} hour{H8160} there was thick-fog{H6205} in all{H3605} the land{H776} until the ninth{H8671} hour{H8160}.","words":[["וסביב","H5439","and around"],["שעה","H8160","hour"],["ששית","H8345","sixth"],["נעשה","H6213","there was"],["ערפליות","H6205","thick-fog"],["בכל","H3605","in all"],["הארץ","H776","the land"],["עד","H5704","until"],["שעה","H8160","hour"],["תשיעית","H8671","ninth"]],"notes":{"one_way_hebrew":["CRITICAL: Uses ערפליות (arafiliyot — plural of ערפל, arafel, H6205 — 'thick fog/dense cloud'). This is the THEOPHANIC DARKNESS of Sinai. Exodus 20:21: 'Moses drew near to the arafel where God was.' Deuteronomy 4:11: 'darkness, cloud, and arafel.' 1 Kings 8:12: 'YHWH said he would dwell in the arafel.' The crucifixion darkness is GOD'S PRESENCE-CLOUD. Greek σκότος ('darkness') is generic. A back-translator would use חשך, NOT the Sinai theophany word."],"greek_deviations":["Hebrew: ערפליות ('theophanic fog'). Greek: σκότος ('darkness'). Divine manifestation vs. natural phenomenon."],"translation_notes":["'Thick-fog' for arafiliyot — the Sinai presence-cloud. God is present at the cross in the same form he appeared at Sinai."],"textual_notes":["Exodus 20:21 — 'Moses drew near to the arafel (ערפל) where God was.'","1 Kings 8:12 — 'YHWH said he would dwell in the arafel.'"]}},
    {"verse":34,"translation":"And at the ninth{H8671} hour{H8160}, Yeshua{H3442} cried out{H2199} with a great{H1419} voice{H6963} and said{H559}: My God{H410}, my God{H410}, why{H4100} have you forsaken{H5800} me?","words":[["ובשעה","H8160","and at the hour"],["תשיעית","H8671","ninth"],["זעק","H2199","cried out"],["ישוע","H3442","Yeshua"],["בקול","H6963","with a voice"],["גדול","H1419","great"],["ואמר","H559","and said"],["אלי","H410","my God"],["אלי","H410","my God"],["למה","H4100","why"],["עזבתני","H5800","have you forsaken me"]],"notes":{"one_way_hebrew":["VERBATIM QUOTE from Psalm 22:1 in pure Hebrew: אלי אלי למה עזבתני. Greek Mark has the Aramaic form Ελωι Ελωι λαμα σαβαχθανι — from the Aramaic Targum. The Hebrew preserves the ORIGINAL PSALM; the Greek preserves an Aramaic paraphrase. A back-translator from the Greek Aramaic would reproduce Aramaic, NOT pure Hebrew."],"greek_deviations":["Hebrew: pure Hebrew Psalm 22:1. Greek: Aramaic quotation. Different languages for the same Psalm."],"translation_notes":[],"textual_notes":["Psalm 22:1 — 'My God, my God, why have you forsaken me? (אלי אלי למה עזבתני).'"]}},
    {"verse":35,"translation":"And some of those standing{H5975} there, when they heard{H8085}, said{H559}: See{H7200} how he calls{H6817} Eliyahu{H452}!","words":[["ומקצת","H7097","and some"],["מן","H4480","of"],["העומדים","H5975","those standing"],["שם","H8033","there"],["כאשר","H834","when"],["שמעו","H8085","they heard"],["אמרו","H559","said"],["ראו","H7200","see"],["איך","","how"],["צועק","H6817","he calls"],["אליהו","H452","Eliyahu"]],"notes":{"one_way_hebrew":["The confusion between אלי ('my God') and אליהו ('Eliyahu') works naturally in Hebrew. This wordplay requires a Semitic language."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":36,"translation":"And one of them ran{H7323} quickly{H4116} and tied{H7194} a sponge to a reed{H7070} and filled{H4390} it with vinegar{H2558}, and gave{H5414} it to him to drink{H8354}, saying: Leave{H5800} him, and let us see{H7200} if Eliyahu{H452} comes{H935} to deliver{H5337} him.","words":[["ואחד","H259","and one"],["מהם","","of them"],["רץ","H7323","ran"],["מהר","H4116","quickly"],["וקשר","H7194","and tied"],["ספוג","","a sponge"],["אחד","H259","one"],["בקנה","H7070","to a reed"],["אחד","H259","one"],["ומלאה","H4390","and filled it"],["חומץ","H2558","vinegar"],["ונותנים","H5414","and giving"],["לו","","to him"],["לשתות","H8354","to drink"],["ואומרים","H559","and saying"],["תעזבובו","H5800","leave him"],["ונראה","H7200","and let us see"],["אם","H518","if"],["יבא","H935","comes"],["אליהו","H452","Eliyahu"],["להצילו","H5337","to deliver him"]],"notes":{"one_way_hebrew":[],"greek_deviations":[],"translation_notes":[],"textual_notes":["Psalm 69:21 — 'For my thirst they gave me vinegar (חמץ) to drink.'"]}},
    {"verse":37,"translation":"And Yeshua{H3442} cried out{H2199} with a great{H1419} voice{H6963} and breathed out{H5301} his spirit{H7307}.","words":[["וישוע","H3442","and Yeshua"],["זעק","H2199","cried out"],["קול","H6963","a voice"],["גדול","H1419","great"],["ונשף","H5301","and breathed out"],["ברוחו","H7307","his spirit"]],"notes":{"one_way_hebrew":["Uses נשף (nashaf — 'breathed out', from H5301). Echoes Genesis 2:7 where God 'breathed (ויפח) into his nostrils the breath of life.' The one into whom God breathed life now breathes out his spirit — a Genesis reversal.","Adds ברוחו ('his spirit', H7307). Greek simply says 'he expired.' Hebrew makes explicit that his ruach departed."],"greek_deviations":["Hebrew: 'breathed out his spirit.' Greek: 'expired' (ἐξέπνευσεν). Hebrew is more theologically specific."],"translation_notes":[],"textual_notes":["Genesis 2:7 — 'YHWH God breathed (ויפח) into his nostrils the breath of life.' Death reverses creation."]}},
    {"verse":38,"translation":"The sanctuary{H4720} was broken{H7665} in two{H8147} sides{H6654}, from above{H4605} to below{H4295}.","words":[["המקדש","H4720","the sanctuary"],["נשבר","H7665","was broken"],["בשני","H8147","in two"],["צדדין","H6654","sides"],["למעלה","H4605","from above"],["ולמטה","H4295","to below"]],"notes":{"one_way_hebrew":["CRITICAL: Uses המקדש נשבר ('the SANCTUARY was BROKEN'). Greek has τὸ καταπέτασμα τοῦ ναοῦ ἐσχίσθη ('the VEIL of the temple was TORN'). TWO irreconcilable differences: (1) Hebrew says the SANCTUARY ITSELF broke, not its veil; (2) Hebrew uses נשבר (nishbar — 'shattered', H7665 — for smashing pottery, Jer 19:11; breaking tablets, Ex 32:19; a broken heart, Ps 34:18, 51:17). Greek uses ἐσχίσθη ('was torn' — a fabric word)."],"greek_deviations":["Hebrew: 'the sanctuary was broken in two sides.' Greek: 'the veil of the temple was torn in two from top to bottom.' Different object, action, and manner."],"translation_notes":["'Broken' for nishbar — the shattering verb. The sanctuary breaks like the covenant tablets (Ex 32:19)."],"textual_notes":["Exodus 32:19 — Moses 'broke (וישבר) the tablets.' Same verb שבר for a covenant-ending act.","Psalm 51:17 — 'A broken (נשבר) and contrite heart, O God, you will not despise.'"]}},
    {"verse":39,"translation":"And the captain{H8269} of the hundred{H3967} who was attending there, when he saw{H7200} that he expired{H5674} with a great{H1419} voice{H6963}, said{H559}: This man{H376} was the Son{H1121} of God{H410}.","words":[["ושר","H8269","and the captain of"],["המאה","H3967","the hundred"],["שהיה","H1961","who was"],["ממתין","","attending"],["שם","H8033","there"],["כאשר","H834","when"],["ראה","H7200","he saw"],["שהוא","","that he"],["היה","H1961","was"],["מועבר","H5674","expired"],["בקול","H6963","with a voice"],["גדול","H1419","great"],["אמר","H559","said"],["זה","H2088","this"],["האיש","H376","man"],["היה","H1961","was"],["בן","H1121","Son of"],["האל","H410","God"]],"notes":{"one_way_hebrew":["Uses שר המאה (sar hame'ah — 'captain of the hundred', H8269+H3967) — the native Hebrew military title (2 Kgs 11:4,9). Greek κεντυρίων is a Latin loanword.","Uses בן האל (ben ha'El — 'Son of THE God'). The definite article makes the claim monotheistic."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":40,"translation":"And there were some women{H802} who came{H935} from afar{H7350} to watch{H5027}, and among them Miryam{H4813} of Magdala and Miryam{H4813} mother{H517} of Ya'aqov{H3290} the small{H6996} and Yosef{H3130}, and the mother{H517} of Shlomi.","words":[["והיו","H1961","and there were"],["שמה","H8033","there"],["מקצת","H7097","some"],["נשים","H802","women"],["שבאו","H935","who came"],["מרחוק","H7350","from afar"],["להביטו","H5027","to watch him"],["ובתוכם","H8432","and among them"],["מרים","H4813","Miryam"],["מגדלית","","of Magdala"],["ומרים","H4813","and Miryam"],["אם","H517","mother of"],["יעקב","H3290","Ya'aqov"],["קטן","H6996","the small"],["ומיסף","H3130","and Yosef"],["ואם","H517","and the mother of"],["שלומי","","Shlomi"]],"notes":{"one_way_hebrew":["Uses שלומי (Shlomi) — a Hebrew name meaning 'my peace.' Greek Σαλώμη (Salome) is a Hellenized form."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":41,"translation":"For when he was in the Galil{H1551}, they were going{H1980} with him, and going{H1980} with many{H7227} others{H312} who came{H935} from Yerushalayim{H3389}.","words":[["כי","H3588","for"],["כאשר","H834","when"],["היה","H1961","he was"],["בגלילה","H1551","in the Galil"],["הן","","they"],["הולכות","H1980","were going"],["עמו","H5973","with him"],["והולכות","H1980","and going"],["עם","H5973","with"],["רבות","H7227","many"],["אחרות","H312","others"],["שבאו","H935","who came"],["מירושלם","H3389","from Yerushalayim"]],"notes":{"one_way_hebrew":[],"greek_deviations":["Hebrew: women 'came from Yerushalayim.' Greek: women 'came up with him TO Jerusalem.' Opposite directions."],"translation_notes":[],"textual_notes":[]}},
    {"verse":42,"translation":"And when evening{H6153} came, the feast{H2282} of the unleavened-bread{H4682} had already entered — that is, before the Shabbat{H7676}.","words":[["וכאשר","H834","and when"],["ערב","H6153","evening"],["נעשה","H6213","came"],["נכנס","H935","entered"],["כבר","","already"],["חג","H2282","feast of"],["המצות","H4682","the unleavened-bread"],["זהו","H2088","that is"],["לפני","H6440","before"],["השבת","H7676","the Shabbat"]],"notes":{"one_way_hebrew":["CRITICAL: Uses חג המצות (chag hamatsot — 'feast of the unleavened-bread', H2282+H4682). Greek has παρασκευή ('preparation day'). Hebrew identifies time by TORAH FESTIVAL (Lev 23:6, Ex 12:17); Greek uses civic terminology. A back-translator would write ערב שבת, NOT the Torah festival name.","The phrase נכנס כבר חג המצות ('the feast had already entered') uses the characteristically Jewish expression where festivals 'enter' at sunset."],"greek_deviations":["Hebrew: 'the feast of Matzot entered.' Greek: 'it was preparation day.' Jewish liturgical vs. civic calendar."],"translation_notes":[],"textual_notes":["Leviticus 23:6 — 'On the fifteenth day is the feast of unleavened bread (חג המצות) to YHWH.'"]}},
    {"verse":43,"translation":"Yosef{H3130} of Ramatayim came{H935}, an honored{H3513} man{H1397} who awaited the kingdom{H4438} of heaven{H8064}, and with boldness he entered to Pilat and asked{H7592} for the body of Yeshua{H3442}.","words":[["בא","H935","came"],["יוסף","H3130","Yosef"],["רמתים","","Ramatayim"],["גבר","H1397","a man"],["נכבד","H3513","honored"],["שהמתין","","who awaited"],["מלכות","H4438","the kingdom of"],["שמים","H8064","heaven"],["ובחריצות","H2742","and with boldness"],["נכנס","H935","entered"],["לפילאט","","to Pilat"],["ושאל","H7592","and asked"],["לו","","for"],["גוף","H1472","the body of"],["ישוע","H3442","Yeshua"]],"notes":{"one_way_hebrew":["Uses רמתים (Ramatayim) — the full Hebrew dual form. Greek Ἀριμαθαίας is Hellenized. Hebrew preserves the native name meaning 'the two heights' — Samuel's birthplace (1 Sam 1:1). A back-translator would transliterate.","Uses גבר נכבד ('honored man', H1397+H3513). Greek εὐσχήμων βουλευτής ('prominent council member'). Hebrew emphasizes character; Greek emphasizes position.","Uses מלכות שמים ('kingdom of heaven'). Greek: βασιλείαν τοῦ θεοῦ ('kingdom of God'). The Jewish circumlocution."],"greek_deviations":[],"translation_notes":[],"textual_notes":["1 Samuel 1:1 — 'a man from Ramatayim-Tsofim.' Joseph's hometown is Samuel's birthplace."]}},
    {"verse":44,"translation":"And Pilat marveled{H6382} if he was already dead{H4191}.","words":[["ופילאט","","and Pilat"],["היה","H1961","was"],["נפלא","H6382","marveled"],["אם","H518","if"],["כבר","","already"],["הוא","","he"],["מת","H4191","was dead"]],"notes":{"one_way_hebrew":[],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":45,"translation":"And he asked{H7592} the executor of judgment{H4941} if he was already dead{H4191}, and when they confirmed through the executor of judgment{H4941}, he gave{H5414} him the body of Yeshua{H3442}.","words":[["ושאל","H7592","and he asked"],["לו","","him"],["עושה","H6213","the executor of"],["המשפט","H4941","the judgment"],["אם","H518","if"],["כבר","","already"],["מת","H4191","dead"],["וכאשר","H834","and when"],["ידעו","H3045","they knew"],["בעד","H1157","through"],["עושה","H6213","the executor of"],["המשפט","H4941","the judgment"],["נתן","H5414","gave"],["לו","","to him"],["גוף","H1472","the body of"],["ישוע","H3442","Yeshua"]],"notes":{"one_way_hebrew":["Uses עושה המשפט ('the executor of judgment') — a FUNCTIONAL DESCRIPTION. Greek has κεντυρίων ('centurion'). Hebrew describes roles by function; a back-translator would transliterate the Latin title."],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}},
    {"verse":46,"translation":"And Yosef{H3130} bought{H7069} a fine{H3303} white{H3836} garment{H899} and took down{H3381} the body from the warp-and-woof and wrapped{H5848} it and placed{H3240} it in a tomb{H6913} of hewn{H2672} stone{H68}, and set{H7760} at the entrance{H6607} of the tomb{H6913} a great{H1419} stone{H68}.","words":[["ויוסף","H3130","and Yosef"],["קנה","H7069","bought"],["בגד","H899","a garment"],["אחד","H259","one"],["יפה","H3303","fine"],["ולבן","H3836","and white"],["והוריד","H3381","and took down"],["הגוף","H1472","the body"],["מהשתי וערב","","from the warp-and-woof"],["ועטפו","H5848","and wrapped it"],["בו","","in it"],["והניחו","H3240","and placed it"],["בקבר","H6913","in a tomb"],["אחד","H259","one"],["של","","of"],["אבן","H68","stone"],["חצובה","H2672","hewn"],["ושם","H7760","and set"],["בפתח","H6607","at the entrance of"],["הקבר","H6913","the tomb"],["אבן","H68","a stone"],["גדולה","H1419","great"]],"notes":{"one_way_hebrew":["Uses אבן חצובה ('hewn stone', H68+H2672). חצב is the OT verb for quarrying (Isa 22:16 — a tomb 'hewn in the height').","Fourth occurrence of שתי וערב for the cross."],"greek_deviations":[],"translation_notes":[],"textual_notes":["Isaiah 53:9 — 'He made his grave with the wicked and with a rich man in his death.' Joseph of Ramatayim is the 'rich man.'"]}},
    {"verse":47,"translation":"And Miryam{H4813} of Magdala and Miryam{H4813} the mother{H517} of Yosef{H3130} were watching{H5027} where they placed{H3240} the body of Yeshua{H3442}.","words":[["ומרים","H4813","and Miryam"],["מגדלית","","of Magdala"],["ומרים","H4813","and Miryam"],["אם","H517","mother of"],["יוסף","H3130","Yosef"],["מביטות","H5027","watching"],["היכן","","where"],["מניחין","H3240","they placed"],["גוף","H1472","the body of"],["ישוע","H3442","Yeshua"]],"notes":{"one_way_hebrew":[],"greek_deviations":[],"translation_notes":[],"textual_notes":[]}}
  ],
  "chapter_notes": {
    "summary": "Mark 15 in Hebrew presents the crucifixion with several extraordinary one-way markers. The most striking: (1) שתי וערב (shti va'erev — 'warp-and-woof') appears FOUR times (vv21,30,32,46) for the cross — a Torah textile metaphor from Leviticus 13 that no back-translator would invent from σταυρός; (2) ערפליות (arafiliyot, v33) — the theophanic thick-darkness of Sinai (Ex 20:21) and Solomon's Temple (1 Kgs 8:12) identifies God's presence at the cross; (3) המקדש נשבר (v38) — 'the sanctuary was BROKEN' where Greek has 'the veil was torn,' irreconcilable differences in both object and action; (4) הספדות (hespadot, v32) — 'funeral speeches' for the thieves' mockery, a uniquely Jewish cultural form; (5) בראבן/בר אבן (Bar-Aven — 'son of iniquity') vs. Barabbas ('son of the father'); (6) השם יושיעך (v18) — soldiers unknowingly pray YHWH's salvation upon Yeshua; (7) Psalm 22:1 quoted in pure Hebrew (v34) vs. Greek's Aramaic; (8) חג המצות (v42) — Torah festival dating vs. 'preparation day'; (9) נצרי (v26) — triple-wordplay title (Nazirite/Branch/Nazarene); (10) עושה המשפט (v45) — native Hebrew functional description vs. Latin title. The Hebrew places the crucifixion within Israel's sacred narrative through Torah vocabulary (talah, goralot, chag, mikdash, argaman, atarah, shti va'erev)."
  }
}

with open('/Users/dlarimer/timetested/data/hg-chapters/Mark-15.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"Mark 15 written: {len(data['verses'])} verses")
