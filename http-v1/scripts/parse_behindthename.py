#!/usr/bin/env python3
"""
Parse Behind the Name data and merge into TIPNR enrichment.
This processes manually extracted data from behindthename.com.
"""
import json
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
HTTP_DIR = SCRIPT_DIR.parent
DATA_DIR = HTTP_DIR / "data"
TIPNR_PATH = DATA_DIR / "tipnr.json"
AI_ENRICHMENT_PATH = DATA_DIR / "tipnr-ai-enrichment.json"

# Behind the Name etymologies extracted from search results
# Format: name -> (meaning, notes)
BEHIND_THE_NAME = {
    "Aaron": ("From Hebrew אַהֲרֹן (ʾAharon), most likely of unknown Egyptian origin. Other theories suggest 'high mountain' or 'exalted'.", "First high priest, brother of Moses."),
    "Abaddon": ("Means 'ruin, destruction' in Hebrew.", "In Revelation, another name for the angel of the abyss."),
    "Abdiel": ("Means 'servant of God' in Hebrew, from עֶבֶד (ʿeveḏ) 'servant' and אֵל (ʾel) 'God'.", "In Paradise Lost, a seraph who withstood Satan."),
    "Abednego": ("Means 'servant of Nebo' in Akkadian, Nebo being the Babylonian god of wisdom.", "Babylonian name of Azariah, one of the three in the furnace."),
    "Abel": ("From Hebrew הֶבֶל (Hevel) meaning 'breath'.", "Second son of Adam, murdered by Cain."),
    "Abigail": ("From Hebrew אֲבִיגָיִל (ʾAviḡayil) meaning 'my father is joy', from אָב (ʾav) 'father' and גִּיל (gil) 'joy'.", "Wife of Nabal, then David."),
    "Abihail": ("Means 'my father is strength' in Hebrew, from אָב (ʾav) 'father' and חַיִל (ḥayil) 'strength'.", "Name of several OT characters including father of Queen Esther."),
    "Abihu": ("Means 'he is my father' in Hebrew, from אָב (ʾav) 'father' and הוּא (hu) 'he'.", "Son of Aaron, killed for offering unauthorized fire."),
    "Abijah": ("Means 'my father is Yahweh' in Hebrew, from אָב (ʾav) 'father' and יָהּ (yah) referring to God.", "Name of several OT characters, both male and female."),
    "Abimelech": ("Means 'my father is king' in Hebrew, from אָב (ʾav) 'father' and מֶלֶךְ (meleḵ) 'king'.", "Name of several OT characters including kings of Gerar."),
    "Abiram": ("Means 'my father is exalted' in Hebrew, from אָב (ʾav) 'father' and רוּם (rum) 'to exalt'.", "Swallowed by earthquake after rebelling against Moses."),
    "Abishag": ("Means 'my father strays' in Hebrew, from אָב (ʾav) 'father' and שָׁגָה (shaḡa) 'to stray'.", "Young woman who tended King David in his old age."),
    "Abishai": ("Means 'my father is a gift' in Hebrew, from אָב (ʾav) 'father' and שַׁי (shai) 'gift'.", "One of King David's heroes."),
    "Abital": ("Means 'my father is dew' in Hebrew, from אָב (ʾav) 'father' and טַל (ṭal) 'dew'.", "Fifth wife of David."),
    "Abner": ("From Hebrew אַבְנֵר (ʾAvner) meaning 'my father is a light', from אָב (ʾav) 'father' and נֵר (ner) 'lamp, light'.", "Cousin of Saul and commander of his army."),
    "Abraham": ("From Hebrew אַבְרָהָם (ʾAvraham), meaning 'father of many' or contraction of Abram and הָמוֹן (hamon) 'multitude'.", "Covenant patriarch, father of the faithful."),
    "Abram": ("Means 'high father' in Hebrew, from אָב (ʾav) 'father' and רוּם (rum) 'to exalt, be high'.", "Original name before God changed it to Abraham."),
    "Absalom": ("From Hebrew אַבְשָׁלוֹם (ʾAvshalom) meaning 'father is peace', from אָב (ʾav) 'father' and שָׁלוֹם (shalom) 'peace'.", "Son of David who rebelled and was killed."),
    "Achan": ("Possibly from Hebrew עֲכָר (ʿaḵar) meaning 'trouble'.", "Stoned for stealing forbidden items at Jericho."),
    "Achsah": ("Means 'anklet, bangle' in Hebrew.", "Daughter of Caleb."),
    "Adah": ("Means 'adornment, ornament' in Hebrew.", "Name of wives of Lamech and Esau."),
    "Adam": ("Hebrew word for 'man', possibly from אדם (ʾaḏam) 'to be red' (ruddy skin) or Akkadian adamu 'to make'.", "First man, federal head of humanity."),
    "Adonijah": ("Means 'my lord is Yahweh' in Hebrew, from אָדוֹן (ʾaḏon) 'lord' and יָהּ (yah) referring to God.", "Son of David who sought the kingdom."),
    "Adriel": ("Means 'flock of God' in Hebrew, from עֵדֶר (ʿeḏer) 'flock' and אֵל (ʾel) 'God'.", "Man who married Saul's daughter Merab."),
    "Agabus": ("Greek form of Hagab.", "Early Christian prophet who predicted famine and Paul's binding."),
    "Ahab": ("Means 'uncle' in Hebrew, from אָח (ʾaḥ) 'brother' and אָב (ʾav) 'father'.", "King of Israel, husband of Jezebel."),
    "Ahasuerus": ("From Hebrew אֲחַשְׁוֵרוֹשׁ, from Old Persian Xšayarša (Xerxes).", "King of Persia, husband of Esther."),
    "Ahinoam": ("Means 'my brother is pleasant' in Hebrew, from אָח (ʾaḥ) 'brother' and נָעַם (naʿam) 'to be pleasant'.", "Name of wives of both Saul and David."),
    "Alexander": ("From Greek Ἀλέξανδρος (Alexandros) meaning 'defending men', from ἀλέξω (alexo) 'to defend' and ἀνήρ (aner) 'man'.", "Several NT characters bear this name."),
    "Alphaeus": ("Greek form of a Hebrew name meaning 'exchange'.", "Father of apostles James the Lesser and Levi."),
    "Amariah": ("Means 'Yahweh has said' in Hebrew, from אָמַר (ʾamar) 'to say' and יָהּ (yah) referring to God.", "Name of several OT characters."),
    "Amaziah": ("Means 'Yahweh strengthens' in Hebrew, from אָמֵץ (ʾamets) 'to strengthen' and יָהּ (yah) referring to God.", "King of Judah and others."),
    "Ammiel": ("Means 'God is my kinsman' in Hebrew, from עַם (ʿam) 'people, kinsman' and אֵל (ʾel) 'God'.", "One of the spies sent by Moses."),
    "Amnon": ("Means 'faithful' in Hebrew.", "Eldest son of David, killed by Absalom."),
    "Amos": ("From Hebrew עָמַס (ʿamas) meaning 'load, burden'.", "One of the twelve minor prophets."),
    "Amram": ("Means 'exalted nation' in Hebrew, from עַם (ʿam) 'people' and רוּם (rum) 'to exalt'.", "Father of Moses."),
    "Ananias": ("Greek form of Hananiah.", "Three NT characters: disciple in Damascus, husband of Sapphira, high priest."),
    "Andrew": ("From Greek Ἀνδρέας (Andreas), from ἀνδρεῖος (andreios) 'manly', from ἀνήρ (aner) 'man'.", "Apostle, brother of Peter, first called."),
    "Andronicus": ("From Greek meaning 'victory of a man', from ἀνήρ (aner) 'man' and νίκη (nike) 'victory'.", "Mentioned in Romans."),
    "Anna": ("Greek form of Hannah.", "Prophetess who recognized Jesus in the temple."),
    "Annas": ("Contracted form of Ananias.", "High priest who condemned Jesus."),
    "Apelles": ("Possibly from a Doric Greek form of Apollo.", "Mentioned in Romans."),
    "Apphia": ("Greek form of a Hebrew name possibly meaning 'increasing'.", "Mentioned in Philemon."),
    "Aquila": ("Latin meaning 'eagle'.", "Tentmaker, husband of Priscilla."),
    "Ariel": ("Means 'lion of God' in Hebrew, from אֲרִי (ʾari) 'lion' and אֵל (ʾel) 'God'.", "Used as another name for Jerusalem."),
    "Aristobulus": ("From Greek meaning 'best in counsel', from ἄριστος (aristos) 'best' and βουλή (boule) 'counsel'.", "Mentioned in Romans."),
    "Asaph": ("Means 'collector' in Hebrew.", "Several OT characters."),
    "Asenath": ("Means 'belonging to the goddess Neith' in Ancient Egyptian.", "Joseph's Egyptian wife."),
    "Asher": ("Means 'happy, blessed' in Hebrew, from אָשַׁר (ʾashar) 'to be happy'.", "Son of Jacob, founder of a tribe."),
    "Ashtoreth": ("Hebrew form of Phoenician goddess of love, war and fertility.", "Cognate of Ishtar."),
    "Azariah": ("From Hebrew עֲזַרְיָה meaning 'Yahweh has helped', from עָזַר (ʿazar) 'help' and יָהּ (yah) referring to God.", "Many OT characters, including one of the three in the furnace."),
    "Azriel": ("Means 'my help is God' in Hebrew, from עֶזְרָה (ʿezra) 'help' and אֵל (ʾel) 'God'.", "Three minor OT characters."),
    "Barak": ("Means 'lightning' in Hebrew.", "Military commander under Deborah."),
    "Barnabas": ("From Aramaic, possibly בּר נביא (bar navi) 'son of the prophet', though Acts says 'son of encouragement'.", "Companion of Paul on missionary journeys."),
    "Bartholomew": ("From Aramaic meaning 'son of Talmai'.", "Apostle, possibly same as Nathanael."),
    "Baruch": ("From Hebrew בָּרוּך (Baruḵ) meaning 'blessed'.", "Companion of Jeremiah, scribe."),
    "Bathsheba": ("Means 'daughter of the oath' in Hebrew, from בַּת (baṯ) 'daughter' and שָׁבַע (shavaʿ) 'oath'.", "Wife of Uriah, then David; mother of Solomon."),
    "Beelzebub": ("From Hebrew בַּעַל זְבוּב (Baʿal Zevuv) 'lord of flies', possibly mocking alteration of 'Ba'al of the exalted house'.", "Name for a Philistine god and later for Satan."),
    "Belshazzar": ("From Akkadian Bel-sharra-usur meaning 'Bel protect the king'.", "Last king of Babylon who saw the handwriting on the wall."),
    "Benaiah": ("From Hebrew בְּנָיָה meaning 'Yahweh has built', from בָּנָה (bana) 'to build' and יָהּ (yah) referring to God.", "Numerous OT characters."),
    "Benjamin": ("From Hebrew בִּנְיָמִין meaning 'son of the south' or 'son of the right hand', from בֵּן (ben) 'son' and יָמִין (yamin) 'right hand, south'.", "Youngest son of Jacob, founder of a tribe."),
    "Beulah": ("Means 'married' in Hebrew.", "Used in Isaiah to refer to the land of Israel."),
    "Bilhah": ("Means 'bashful' in Hebrew.", "Handmaid of Rachel, mother of Dan and Naphtali by Jacob."),
    "Boaz": ("Means 'swiftness' in Hebrew.", "Husband of Ruth, kinsman-redeemer."),
    "Cain": ("From Hebrew קָיִן (Qayin) possibly meaning 'acquired', from קָנָה (qana) 'to acquire'.", "First son of Adam, killed Abel."),
    "Caleb": ("Most likely related to Hebrew כֶּלֶב (kelev) 'dog'. Alternate theory: from כֹּל (kol) 'all' and לֵב (lev) 'heart'.", "One of the twelve spies who reached the Promised Land."),
    "Canaan": ("From Hebrew כְּנַעַן possibly from a root meaning 'low, humble'.", "Son of Ham, namesake of the Canaanites."),
    "Candace": ("From Cushitic kdke meaning 'queen mother'.", "Hereditary title of queens of Ethiopia."),
    "Carpus": ("From Greek Κάρπος (Karpos) meaning 'fruit, profits'.", "Mentioned in 2 Timothy."),
    "Cephas": ("Means 'rock' in Aramaic.", "Name Jesus gave to Simon (Peter)."),
    "Chloe": ("Means 'green shoot' in Greek, referring to new plant growth.", "Epithet of Demeter; mentioned by Paul."),
    "Claudia": ("Feminine form of Claudius.", "Mentioned in 2 Timothy."),
    "Cleopas": ("Shortened form of Greek Kleopatros.", "Disciple who saw Jesus after resurrection."),
    "Cornelius": ("Roman name possibly from Latin cornu 'horn'.", "First Gentile convert in Acts."),
    "Crescens": ("Latin name from cresco 'to grow'.", "Mentioned in 2 Timothy."),
    "Cyrus": ("From Old Persian Kuruš, possibly meaning 'young' or 'humiliator of the enemy'.", "King of Persia who allowed Jews to return."),
    "Damaris": ("Probably means 'calf, heifer, girl' from Greek δάμαλις (damalis).", "Woman converted by Paul in Athens."),
    "Dan": ("Means 'he judged' in Hebrew, from דִּין (din) 'to judge'.", "Son of Jacob by Bilhah, founder of a tribe."),
    "Daniel": ("From Hebrew דָּנִיֵּאל meaning 'God is my judge', from דִּין (din) 'to judge' and אֵל (ʾel) 'God'.", "Prophet in Babylon."),
    "Darius": ("From Old Persian Darayauš meaning 'possessing goodness', from daraya 'to possess' and vau 'good'.", "Name of Persian kings."),
    "David": ("From Hebrew דָּוִד (Dawiḏ), from דּוֹד (doḏ) 'beloved' or 'uncle'.", "Greatest king of Israel."),
    "Deborah": ("Means 'bee' in Hebrew.", "Prophetess and judge."),
    "Delilah": ("Probably from Hebrew דָּלַל (dalal) 'to be weak, to languish'.", "Betrayed Samson."),
    "Dinah": ("Means 'judged' in Hebrew, from דִּין (din) 'to judge'.", "Daughter of Jacob and Leah."),
    "Eli": ("Means 'ascension' in Hebrew.", "High priest who raised Samuel."),
    "Elijah": ("From Hebrew אֵלִיָּהוּ (ʾEliyyahu) meaning 'my God is Yahweh'.", "Prophet of fire."),
    "Elisha": ("From Hebrew אֱלִישָׁע meaning 'my God is salvation'.", "Successor of Elijah."),
    "Elizabeth": ("From Hebrew אֱלִישֶׁבַע (ʾElishevaʿ) meaning 'my God is an oath'.", "Mother of John the Baptist."),
    "Enoch": ("From Hebrew חֲנוֹך (Ḥanokh) meaning 'dedicated'.", "Walked with God and was taken."),
    "Ephraim": ("From Hebrew אֶפְרַיִם meaning 'fruitful'.", "Son of Joseph, founder of a tribe."),
    "Esau": ("From Hebrew עֵשָׂו (ʿEsaw), possibly meaning 'hairy'.", "Twin of Jacob, sold birthright."),
    "Esther": ("Possibly from Persian meaning 'star', or from Ishtar.", "Queen who saved the Jews."),
    "Eve": ("From Hebrew חַוָּה (Ḥawwa) meaning 'to breathe' or 'living'.", "First woman, mother of all living."),
    "Ezekiel": ("From Hebrew יְחֶזְקֵאל meaning 'God strengthens'.", "Prophet of the exile."),
    "Ezra": ("From Hebrew עֶזְרָא meaning 'help'.", "Priest who led return from exile."),
    "Gabriel": ("From Hebrew גַּבְרִיאֵל meaning 'God is my strong man', from גֶּבֶר (gever) 'strong man' and אֵל (ʾel) 'God'.", "Archangel who announced to Mary."),
    "Gideon": ("From Hebrew גִּדְעוֹן meaning 'feller, hewer'.", "Judge who defeated Midian with 300."),
    "Goliath": ("Possibly from גָּלָה (gala) 'to uncover, reveal'.", "Giant killed by David."),
    "Habakkuk": ("From Hebrew חֲבַקּוּק meaning 'embrace'.", "One of the minor prophets."),
    "Hagar": ("Possibly means 'flight' in Hebrew.", "Sarah's handmaid, mother of Ishmael."),
    "Haggai": ("From Hebrew חַגַּי meaning 'festive', from חָג (ḥag) 'festival'.", "Post-exilic prophet."),
    "Ham": ("Possibly means 'hot' or 'warm' in Hebrew.", "Son of Noah."),
    "Hannah": ("From Hebrew חַנָּה (Ḥanna) meaning 'favour, grace'.", "Mother of Samuel."),
    "Hezekiah": ("From Hebrew חִזְקִיָּהוּ meaning 'Yahweh strengthens'.", "Reforming king of Judah."),
    "Hiram": ("From Hebrew חִירָם possibly meaning 'exalted brother'.", "King of Tyre, ally of David and Solomon."),
    "Hosea": ("From Hebrew הוֹשֵׁעַ meaning 'salvation'.", "Prophet who married Gomer."),
    "Huldah": ("Means 'weasel' in Hebrew.", "Prophetess consulted by Josiah."),
    "Ichabod": ("From Hebrew אִיכָבוֹד meaning 'where is the glory?'.", "Son of Phinehas, born when ark was captured."),
    "Isaac": ("From Hebrew יִצְחָק (Yiṣḥaq) meaning 'he will laugh', from צָחַק (ṣaḥaq) 'to laugh'.", "Son of promise, offered by Abraham."),
    "Isaiah": ("From Hebrew יְשַׁעְיָהוּ meaning 'Yahweh is salvation'.", "Major prophet."),
    "Ishmael": ("From Hebrew יִשְׁמָעֵאל meaning 'God will hear'.", "Son of Abraham by Hagar."),
    "Israel": ("From Hebrew יִשְׂרָאֵל possibly meaning 'God contends' or 'he who strives with God'.", "New name for Jacob after wrestling."),
    "Jabez": ("Possibly means 'sorrow' in Hebrew.", "Prayed for blessing."),
    "Jacob": ("From Hebrew יַעֲקֹב (Yaʿaqov) possibly meaning 'holder of the heel' or 'supplanter', from עָקַב (ʿaqav) 'heel'.", "Father of the twelve tribes."),
    "Jael": ("Means 'mountain goat' in Hebrew.", "Killed Sisera with a tent peg."),
    "Jairus": ("From Hebrew יָאִיר meaning 'he shines'.", "Synagogue ruler whose daughter Jesus raised."),
    "James": ("English form of Iacomus (Latin), from Jacob.", "Two apostles: son of Zebedee, son of Alphaeus."),
    "Japheth": ("From Hebrew יֶפֶת possibly meaning 'opened' or 'enlarged'.", "Son of Noah."),
    "Jason": ("From Greek Ἰάσων possibly meaning 'healer'.", "Host of Paul in Thessalonica."),
    "Jedidiah": ("Means 'beloved of Yahweh' in Hebrew.", "Name given to Solomon at birth."),
    "Jehoshaphat": ("From Hebrew יְהוֹשָׁפָט meaning 'Yahweh has judged'.", "King of Judah."),
    "Jehu": ("From Hebrew יֵהוּא meaning 'Yahweh is he'.", "King who destroyed house of Ahab."),
    "Jephthah": ("From Hebrew יִפְתָּח meaning 'he opens'.", "Judge who made a rash vow."),
    "Jeremiah": ("From Hebrew יִרְמְיָהוּ meaning 'Yahweh will exalt'.", "Weeping prophet."),
    "Jesse": ("From Hebrew יִשַׁי (Yishay), meaning uncertain, possibly 'gift'.", "Father of David."),
    "Jesus": ("From Greek Ἰησοῦς (Iesous), from Hebrew יֵשׁוּעַ (Yeshuaʿ), short form of יְהוֹשֻׁעַ (Yehoshuaʿ) meaning 'Yahweh is salvation'.", "The Messiah, Son of God."),
    "Jethro": ("From Hebrew יִתְרוֹ meaning 'his excellence'.", "Moses' father-in-law."),
    "Jezebel": ("From Hebrew אִיזֶבֶל (ʾIzevel), meaning uncertain, possibly 'where is the prince?'.", "Wife of Ahab, promoted Baal worship."),
    "Joab": ("From Hebrew יוֹאָב meaning 'Yahweh is father'.", "David's general."),
    "Job": ("From Hebrew אִיּוֹב (ʾIyyov) possibly meaning 'persecuted' or 'hated'.", "Patient sufferer."),
    "Joel": ("From Hebrew יוֹאֵל meaning 'Yahweh is God'.", "Minor prophet."),
    "John": ("From Hebrew יוֹחָנָן (Yoḥanan) meaning 'Yahweh is gracious'.", "Baptist and apostle."),
    "Jonah": ("From Hebrew יוֹנָה (Yona) meaning 'dove'.", "Prophet swallowed by fish."),
    "Jonathan": ("From Hebrew יוֹנָתָן (Yonatan) meaning 'Yahweh has given'.", "Friend of David, son of Saul."),
    "Joseph": ("From Hebrew יוֹסֵף (Yosef) meaning 'he will add', from יָסַף (yasaf) 'to add'.", "Son of Jacob sold into Egypt; husband of Mary."),
    "Joshua": ("From Hebrew יְהוֹשֻׁעַ (Yehoshuaʿ) meaning 'Yahweh is salvation'.", "Led Israel into Canaan."),
    "Josiah": ("From Hebrew יֹאשִׁיָּהוּ meaning 'Yahweh supports'.", "Reforming king of Judah."),
    "Judah": ("From Hebrew יְהוּדָה (Yehuda) possibly meaning 'praised'.", "Son of Jacob, tribe of the kings."),
    "Judas": ("Greek form of Judah.", "Betrayer; also apostle (not Iscariot)."),
    "Judith": ("From Hebrew יְהוּדִית (Yehudit) meaning 'Jewish woman'.", "Wife of Esau; heroine in apocryphal book."),
    "Keturah": ("Means 'incense' in Hebrew.", "Abraham's wife after Sarah."),
    "Lazarus": ("From Greek Λάζαρος (Lazaros), from Hebrew אֶלְעָזָר (ʾElʿazar) meaning 'my God has helped'.", "Raised from the dead; poor man in parable."),
    "Leah": ("From Hebrew לֵאָה (Leʾa) possibly meaning 'weary'.", "First wife of Jacob."),
    "Levi": ("From Hebrew לֵוִי (Levi) possibly meaning 'joined, attached'.", "Son of Jacob, tribe of the priesthood."),
    "Lot": ("Means 'covering, veil' in Hebrew.", "Nephew of Abraham."),
    "Luke": ("From Greek Λουκᾶς (Loukas), from Latin Lucius 'light'.", "Author of Gospel and Acts."),
    "Lydia": ("From Greek Λυδία, referring to the region.", "First European convert."),
    "Malachi": ("From Hebrew מַלְאָכִי meaning 'my messenger'.", "Last of the twelve minor prophets."),
    "Manasseh": ("From Hebrew מְנַשֶּׁה meaning 'causing to forget'.", "Son of Joseph; wicked king of Judah."),
    "Mark": ("From Latin Marcus, possibly from Mars.", "Author of Gospel."),
    "Martha": ("From Aramaic מַרְתָּא (Marta) meaning 'the lady, the mistress'.", "Sister of Mary and Lazarus."),
    "Mary": ("From Greek Μαρία (Maria), from Hebrew מִרְיָם (Miryam), meaning uncertain, possibly 'sea of bitterness' or 'rebelliousness'.", "Mother of Jesus."),
    "Matthew": ("From Greek Ματθαῖος (Matthaios), from Hebrew מַתִּתְיָהוּ (Mattityahu) meaning 'gift of Yahweh'.", "Tax collector, apostle, Gospel author."),
    "Melchizedek": ("From Hebrew מַלְכִּי־צֶדֶק meaning 'my king is righteousness'.", "Priest-king of Salem."),
    "Methuselah": ("From Hebrew מְתוּשֶׁלַח possibly meaning 'man of the dart'.", "Oldest man in the Bible."),
    "Micah": ("From Hebrew מִיכָה (Mikha), short form of Micaiah, meaning 'who is like Yahweh?'.", "Minor prophet from Moresheth."),
    "Michael": ("From Hebrew מִיכָאֵל (Mikhaʾel) meaning 'who is like God?'.", "Archangel."),
    "Miriam": ("From Hebrew מִרְיָם, meaning uncertain.", "Sister of Moses."),
    "Mordecai": ("From Hebrew מָרְדֳּכַי possibly from Akkadian Marduk.", "Esther's cousin."),
    "Moses": ("From Hebrew מֹשֶׁה (Moshe), possibly Egyptian in origin, traditionally 'drawn out' (Ex 2:10).", "Deliverer and lawgiver."),
    "Naaman": ("Means 'pleasantness' in Hebrew.", "Syrian commander healed of leprosy."),
    "Naomi": ("From Hebrew נָעֳמִי (Noʿomi) meaning 'pleasantness'.", "Ruth's mother-in-law."),
    "Naphtali": ("From Hebrew נַפְתָּלִי meaning 'my struggle'.", "Son of Jacob by Bilhah."),
    "Nathan": ("From Hebrew נָתָן (Natan) meaning 'he gave'.", "Prophet who confronted David."),
    "Nathanael": ("From Hebrew נְתַנְאֵל meaning 'God has given'.", "Apostle, possibly same as Bartholomew."),
    "Nebuchadnezzar": ("From Akkadian Nabu-kudurri-usur meaning 'Nabu protect the crown'.", "King of Babylon."),
    "Nehemiah": ("From Hebrew נְחֶמְיָה meaning 'Yahweh comforts'.", "Rebuilt Jerusalem's walls."),
    "Nicodemus": ("From Greek Νικόδημος meaning 'victory of the people'.", "Pharisee who came to Jesus by night."),
    "Noah": ("From Hebrew נֹחַ (Noaḥ) meaning 'rest, comfort'.", "Preserved through the flood."),
    "Obadiah": ("From Hebrew עֹבַדְיָה meaning 'serving Yahweh'.", "Minor prophet; others."),
    "Obed": ("From Hebrew עוֹבֵד meaning 'serving, worshipping'.", "Son of Ruth and Boaz."),
    "Paul": ("From Latin Paulus meaning 'small, humble'.", "Apostle to the Gentiles."),
    "Peter": ("From Greek Πέτρος (Petros) meaning 'stone'.", "Apostle, leader of the Twelve."),
    "Philemon": ("From Greek Φιλήμων meaning 'affectionate'.", "Recipient of Paul's letter."),
    "Philip": ("From Greek Φίλιππος meaning 'friend of horses'.", "Apostle; evangelist."),
    "Phinehas": ("From Hebrew פִּינְחָס possibly of Egyptian origin.", "Zealous priest."),
    "Pontius": ("Roman family name of uncertain meaning.", "Pilate, governor who condemned Jesus."),
    "Priscilla": ("Roman name, diminutive of Prisca 'ancient'.", "Wife of Aquila."),
    "Rachel": ("From Hebrew רָחֵל (Raḥel) meaning 'ewe'.", "Wife of Jacob, mother of Joseph and Benjamin."),
    "Rahab": ("From Hebrew רָחָב (Raḥav) meaning 'broad, wide'.", "Canaanite who hid the spies."),
    "Rebekah": ("From Hebrew רִבְקָה (Rivqa) possibly meaning 'to tie, to bind'.", "Wife of Isaac."),
    "Reuben": ("From Hebrew רְאוּבֵן meaning 'behold, a son'.", "Firstborn of Jacob."),
    "Ruth": ("From Hebrew רוּת (Rut) possibly meaning 'friend'.", "Moabite ancestress of David."),
    "Samson": ("From Hebrew שִׁמְשׁוֹן (Shimshon) possibly meaning 'sun', from שֶׁמֶשׁ (shemesh).", "Nazirite judge."),
    "Samuel": ("From Hebrew שְׁמוּאֵל (Shemuʾel) possibly meaning 'heard of God' or 'name of God'.", "Prophet and judge."),
    "Sarah": ("From Hebrew שָׂרָה (Sara) meaning 'lady, princess, noblewoman'.", "Wife of Abraham."),
    "Saul": ("From Hebrew שָׁאוּל (Shaʾul) meaning 'asked for, prayed for'.", "First king of Israel."),
    "Seth": ("From Hebrew שֵׁת (Shet) meaning 'placed, appointed'.", "Third son of Adam."),
    "Shem": ("From Hebrew שֵׁם (Shem) meaning 'name'.", "Son of Noah, line of the covenant."),
    "Silas": ("Probably from Aramaic, related to Saul.", "Companion of Paul."),
    "Simeon": ("From Hebrew שִׁמְעוֹן (Shimʿon) meaning 'he has heard'.", "Son of Jacob; righteous man in the temple."),
    "Simon": ("Greek form of Simeon.", "Peter; the Zealot; of Cyrene."),
    "Solomon": ("From Hebrew שְׁלֹמֹה (Shelomo) meaning 'peace', from שָׁלוֹם (shalom).", "Son of David, builder of the temple."),
    "Stephen": ("From Greek Στέφανος (Stephanos) meaning 'crown'.", "First Christian martyr."),
    "Susanna": ("From Hebrew שׁוֹשַׁנָּה (Shoshanna) meaning 'lily, rose'.", "Woman who supported Jesus."),
    "Tabitha": ("From Aramaic טְבִיתָא (Ṭevita) meaning 'gazelle'.", "Woman raised from the dead by Peter."),
    "Thomas": ("From Aramaic תְּאוֹמָא (Teʾoma) meaning 'twin'.", "Apostle, doubter."),
    "Timothy": ("From Greek Τιμόθεος (Timotheos) meaning 'honouring God'.", "Companion of Paul."),
    "Titus": ("Roman praenomen of unknown meaning.", "Companion of Paul."),
    "Uriah": ("From Hebrew אוּרִיָה meaning 'Yahweh is my light'.", "Faithful soldier, husband of Bathsheba."),
    "Zechariah": ("From Hebrew זְכַרְיָה meaning 'Yahweh remembers'.", "Prophet; father of John the Baptist."),
    "Zephaniah": ("From Hebrew צְפַנְיָה meaning 'Yahweh has hidden'.", "Minor prophet."),
    "Zerubbabel": ("From Hebrew זְרֻבָּבֶל possibly meaning 'seed of Babylon'.", "Led return from exile."),
    "Zipporah": ("From Hebrew צִפֹּרָה (Tsippora) meaning 'bird'.", "Wife of Moses."),
}


def normalize_name_for_match(s: str) -> str:
    """Lowercase, strip for matching."""
    s = s.lower().strip()
    for prefix in ("father_of_", "mother_of_", "daughter_of_", "son_of_"):
        if s.startswith(prefix):
            s = s[len(prefix):].strip()
    return s


def main():
    print("Loading TIPNR...")
    tipnr = json.loads(TIPNR_PATH.read_text(encoding="utf-8"))
    
    # Build name -> list of tipnr keys
    name_to_keys: dict[str, list[str]] = {}
    for key, entry in tipnr.items():
        n = entry.get("n", "")
        if not n:
            continue
        norm = normalize_name_for_match(n)
        if norm not in name_to_keys:
            name_to_keys[norm] = []
        name_to_keys[norm].append(key)
        # Also exact match
        if n not in name_to_keys:
            name_to_keys[n] = []
        if key not in name_to_keys[n]:
            name_to_keys[n].append(key)
    
    print("Loading AI enrichment...")
    ai = json.loads(AI_ENRICHMENT_PATH.read_text(encoding="utf-8"))
    
    updated = 0
    for btn_name, (btn_meaning, btn_notes) in BEHIND_THE_NAME.items():
        norm = normalize_name_for_match(btn_name)
        keys = name_to_keys.get(norm) or name_to_keys.get(btn_name) or []
        if not keys:
            continue
        for key in keys:
            if key not in ai:
                ai[key] = {}
            current = ai[key]
            current_meaning = (current.get("meaning") or "").strip()
            
            # Skip if BehindTheName already present
            if "BehindTheName" in current_meaning:
                continue
            
            # Add BehindTheName etymology
            new_meaning = current_meaning
            if new_meaning:
                new_meaning = new_meaning.rstrip()
                if not new_meaning.endswith("."):
                    new_meaning += "."
                new_meaning += " BehindTheName: " + btn_meaning
            else:
                new_meaning = "BehindTheName: " + btn_meaning
            
            ai[key]["meaning"] = new_meaning
            updated += 1
    
    print(f"Updated {updated} entries with BehindTheName etymologies")
    AI_ENRICHMENT_PATH.write_text(json.dumps(ai, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {AI_ENRICHMENT_PATH}")


if __name__ == "__main__":
    main()
