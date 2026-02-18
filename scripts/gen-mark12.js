const fs = require('fs');
const data = {
  book: "Mark",
  chapter: 12,
  source: "Marqu - The Hebrew Gospel of Mark v1.2",
  verses: [
    {
      verse: 1,
      translation: "And he began{H2490} to speak{H1696} to them in parables and said{H559}: A man{H120} planted{H5193} a vineyard{H3754} and enclosed{H5462} it securely{H3190} with thorns{H329}, and dug{H2658} it out, and built{H1129} in it one{H259} tower{H4026}, and hired it out{H7936} to workers{H5647} of the ground{H127}; and he went{H1980} on a long{H752} journey.",
      words: [
        ["\u05d5\u05d4\u05ea\u05d7\u05d9\u05dc\u05dd", "H2490", "and he began"],
        ["\u05dc\u05d3\u05d1\u05e8", "H1696", "to speak"],
        ["\u05d3\u05de\u05d9\u05d5\u05e0\u05d5\u05ea", "", "parables"],
        ["\u05d5\u05d0\u05de\u05e8", "H559", "and said"],
        ["\u05d0\u05d3\u05dd", "H120", "a man"],
        ["\u05d0\u05d7\u05d3", "H259", "one"],
        ["\u05e0\u05d8\u05e2", "H5193", "planted"],
        ["\u05db\u05e8\u05dd", "H3754", "a vineyard"],
        ["\u05d5\u05e1\u05d2\u05e8", "H5462", "and enclosed"],
        ["\u05d0\u05d5\u05ea\u05d4", "", "it"],
        ["\u05d4\u05d9\u05d8\u05d1", "H3190", "securely"],
        ["\u05d1\u05d0\u05d8\u05d3\u05d9\u05dd", "H329", "with thorns"],
        ["\u05d5\u05d7\u05e4\u05e8", "H2658", "and dug"],
        ["\u05d0\u05d5\u05ea\u05d4", "", "it"],
        ["\u05d5\u05d1\u05e0\u05d4", "H1129", "and built"],
        ["\u05d1\u05d4", "", "in it"],
        ["\u05de\u05d2\u05d3\u05dc", "H4026", "a tower"],
        ["\u05d0\u05d7\u05d3", "H259", "one"],
        ["\u05d5\u05e9\u05db\u05e8", "H7936", "and hired out"],
        ["\u05d0\u05d5\u05ea\u05d4", "", "it"],
        ["\u05dc\u05e2\u05d5\u05d1\u05d3\u05d9", "H5647", "to workers of"],
        ["\u05d0\u05d3\u05de\u05d4", "H127", "the ground"],
        ["\u05d5\u05d4\u05dc\u05da", "H1980", "and went"],
        ["\u05d1\u05de\u05d4\u05dc\u05da", "", "on a journey"],
        ["\u05d0\u05e8\u05d5\u05da", "H752", "long"]
      ],
      notes: {
        one_way_hebrew: [
          "CRITICAL \u2014 THORNS: Uses \u05d1\u05d0\u05d8\u05d3\u05d9\u05dd (ba\u2019atadim, H329 \u2014 \u2018with thorns/brambles\u2019). Greek has \u03c6\u03c1\u03b1\u03b3\u03bc\u03cc\u03bd (\u2018fence/hedge\u2019). The Hebrew word \u05d0\u05d8\u05d3 appears in the parable of the trees where the bramble/thorn becomes king (Judg 9:14-15) and at the threshing floor of Atad (Gen 50:10-11). A back-translator from Greek \u2018fence\u2019 would use \u05d2\u05d3\u05e8 (gader \u2014 \u2018fence/wall\u2019), NOT the OT-specific \u05d0\u05d8\u05d3\u05d9\u05dd. The vineyard owner\u2019s investment in thorns foreshadows the crown of thorns placed on his son \u2014 the same word family connecting the vineyard\u2019s hedge to the son\u2019s suffering.",
          "Uses \u05e2\u05d5\u05d1\u05d3\u05d9 \u05d0\u05d3\u05de\u05d4 (ovdei adamah \u2014 \u2018workers of the ground\u2019), with \u05d0\u05d3\u05de\u05d4 (adamah, H127 \u2014 \u2018ground/soil\u2019). Greek has \u03b3\u03b5\u03c9\u03c1\u03b3\u03bf\u1fd6\u03c2 (\u2018farmers/tenants\u2019). The Hebrew echoes Genesis 2:5 and 3:23 where the adam works the adamah. The vineyard parable recapitulates Eden: a man places workers on the ground (adamah) and they rebel. A back-translator from Greek would use \u05d0\u05db\u05e8\u05d9\u05dd (\u2018farmers\u2019), not the Genesis-laden ovdei adamah.",
          "Uses \u05d3\u05de\u05d9\u05d5\u05e0\u05d5\u05ea (dimyonot \u2014 \u2018likenesses/parables\u2019), from \u05d3\u05de\u05d9\u05d5\u05df (\u2018likeness/image\u2019). This is a native Hebrew word from the root \u05d3\u05de\u05d4 (damah \u2014 \u2018to be like/resemble\u2019). Greek has \u03c0\u03b1\u03c1\u03b1\u03b2\u03bf\u03bb\u03b1\u1fd6\u03c2 (\u2018parables\u2019). While similar in function, the Hebrew word emphasizes visual resemblance \u2014 a natively developed form."
        ],
        greek_deviations: [
          "Hebrew: \u2018enclosed it securely with thorns\u2019 (\u05d1\u05d0\u05d8\u05d3\u05d9\u05dd). Greek: \u2018put a fence around it\u2019 (\u03c6\u03c1\u03b1\u03b3\u03bc\u1f78\u03bd \u03c0\u03b5\u03c1\u03b9\u03ad\u03b8\u03b7\u03ba\u03b5\u03bd). Different enclosure: thorns vs. fence."
        ],
        translation_notes: [],
        textual_notes: [
          "The parable draws from Isaiah 5:1-7: \u2018My beloved had a vineyard on a fertile hill. He dug it and cleared it of stones and planted it with choice vines; he built a watchtower in the midst of it, and also hewed out a wine vat in it.\u2019 The Hebrew Gospels preserve the Isaiah connection with the same vocabulary."
        ]
      }
    }
  ],
  chapter_notes: {
    summary: ""
  }
};
fs.writeFileSync('data/hg-chapters/Mark-12-test.json', JSON.stringify(data, null, 2));
console.log('Test write OK');
