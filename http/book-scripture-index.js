// Book Scripture Index
// Maps Bible verse references to chapters in "A Time Tested Tradition"
// Generated from chapter content analysis

const BOOK_SCRIPTURE_INDEX = {
  // Format: "Book Chapter:Verse" -> [{chapter, title, anchor}]
  // Anchor format: ref-{book}-{chapter}-{verse} (normalized)
  
  // Genesis
  "Genesis 1:1-5": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-genesis-1-1"}],
  "Genesis 1:14": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-genesis-1-14"}, {chapter: "10", title: "When is the Sabbath", anchor: "ref-genesis-1-14"}, {chapter: "18", title: "Appointed Times", anchor: "ref-genesis-1-14"}],
  "Genesis 1:14-16": [{chapter: "05", title: "Where Does the Day Start", anchor: "ref-genesis-1-14"}, {chapter: "06", title: "When Does the Day Start", anchor: "ref-genesis-1-14"}, {chapter: "07", title: "When Does the Month Start", anchor: "ref-genesis-1-14"}, {chapter: "18", title: "Appointed Times", anchor: "ref-genesis-1-14"}],
  "Genesis 2:2-3": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-genesis-2-2"}],
  "Genesis 3:1": [{chapter: "17", title: "Commands to Follow", anchor: "ref-genesis-3-1"}],
  "Genesis 8:22": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-genesis-8-22"}],
  "Genesis 10:8-10": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-genesis-10-8"}],
  "Genesis 15:12": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-genesis-15-12"}],
  "Genesis 15:17": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-genesis-15-17"}],
  
  // Exodus
  "Exodus 9:31": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-exodus-9-31"}],
  "Exodus 12:3": [{chapter: "14", title: "Passion Week", anchor: "ref-exodus-12-3"}, {chapter: "18", title: "Appointed Times", anchor: "ref-exodus-12-3"}],
  "Exodus 12:4-10": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-12-4"}],
  "Exodus 12:6": [{chapter: "14", title: "Passion Week", anchor: "ref-exodus-12-6"}, {chapter: "18", title: "Appointed Times", anchor: "ref-exodus-12-6"}],
  "Exodus 12:15": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-12-15"}],
  "Exodus 12:18": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-12-18"}],
  "Exodus 12:22": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-12-22"}],
  "Exodus 12:37": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-12-37"}, {chapter: "10", title: "When is the Sabbath", anchor: "ref-exodus-12-37"}],
  "Exodus 12:40-41": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-exodus-12-40"}],
  "Exodus 12:49": [{chapter: "17", title: "Commands to Follow", anchor: "ref-exodus-12-49"}],
  "Exodus 13:2": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-13-2"}, {chapter: "10", title: "When is the Sabbath", anchor: "ref-exodus-13-2"}],
  "Exodus 13:4": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-exodus-13-4"}],
  "Exodus 16:1": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-16-1"}],
  "Exodus 16:13": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-16-13"}],
  "Exodus 16:22-23": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-16-22"}],
  "Exodus 16:23": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-16-23"}],
  "Exodus 16:26-27": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-16-26"}],
  "Exodus 17:9": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-17-9"}],
  "Exodus 20:8": [{chapter: "18", title: "Appointed Times", anchor: "ref-exodus-20-8"}],
  "Exodus 20:8-11": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-exodus-20-8"}, {chapter: "14", title: "Passion Week", anchor: "ref-exodus-20-8"}],
  "Exodus 22:29": [{chapter: "18", title: "Appointed Times", anchor: "ref-exodus-22-29"}],
  "Exodus 23:2": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-23-2"}],
  "Exodus 27:21": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-27-21"}],
  "Exodus 29:38-39": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-29-38"}],
  "Exodus 29:42-45": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-exodus-29-42"}],
  "Exodus 31:13": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-exodus-31-13"}],
  "Exodus 31:16-17": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-exodus-31-16"}],
  "Exodus 32:5": [{chapter: "18", title: "Appointed Times", anchor: "ref-exodus-32-5"}],
  "Exodus 32:18": [{chapter: "18", title: "Appointed Times", anchor: "ref-exodus-32-18"}],
  "Exodus 32:28": [{chapter: "18", title: "Appointed Times", anchor: "ref-exodus-32-28"}],
  "Exodus 34:22": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-exodus-34-22"}, {chapter: "18", title: "Appointed Times", anchor: "ref-exodus-34-22"}],
  
  // Leviticus
  "Leviticus 1:4": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-leviticus-1-4"}],
  "Leviticus 7:15-17": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-leviticus-7-15"}],
  "Leviticus 15:16": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-leviticus-15-16"}],
  "Leviticus 15:21": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-leviticus-15-21"}],
  "Leviticus 16:11-14": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-16-11"}],
  "Leviticus 16:15-34": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-16-15"}],
  "Leviticus 16:29": [{chapter: "17", title: "Commands to Follow", anchor: "ref-leviticus-16-29"}],
  "Leviticus 16:31": [{chapter: "17", title: "Commands to Follow", anchor: "ref-leviticus-16-31"}],
  "Leviticus 17:7": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-leviticus-17-7"}],
  "Leviticus 21:22": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-leviticus-21-22"}],
  "Leviticus 23:2-3": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-leviticus-23-2"}],
  "Leviticus 23:5": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-leviticus-23-5"}],
  "Leviticus 23:5-8": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-5"}],
  "Leviticus 23:9-14": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-9"}],
  "Leviticus 23:10-11": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-leviticus-23-10"}],
  "Leviticus 23:13": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-13"}],
  "Leviticus 23:15": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-15"}],
  "Leviticus 23:15-16": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-leviticus-23-15"}, {chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-15"}],
  "Leviticus 23:15-17": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-15"}],
  "Leviticus 23:21": [{chapter: "17", title: "Commands to Follow", anchor: "ref-leviticus-23-21"}],
  "Leviticus 23:23-24": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-23"}],
  "Leviticus 23:26-32": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-leviticus-23-26"}],
  "Leviticus 23:27": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-27"}],
  "Leviticus 23:29-30": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-leviticus-23-29"}],
  "Leviticus 23:33-36": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-33"}],
  "Leviticus 23:39-43": [{chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-23-39"}],
  "Leviticus 23:41": [{chapter: "17", title: "Commands to Follow", anchor: "ref-leviticus-23-41"}],
  "Leviticus 24:3": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-leviticus-24-3"}],
  "Leviticus 25:8-10": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-leviticus-25-8"}, {chapter: "18", title: "Appointed Times", anchor: "ref-leviticus-25-8"}],
  
  // Numbers
  "Numbers 10:10": [{chapter: "18", title: "Appointed Times", anchor: "ref-numbers-10-10"}],
  "Numbers 15:28-30": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-numbers-15-28"}],
  "Numbers 15:37-41": [{chapter: "19", title: "Miscellaneous Commands", anchor: "ref-numbers-15-37"}],
  "Numbers 18:12": [{chapter: "18", title: "Appointed Times", anchor: "ref-numbers-18-12"}],
  "Numbers 19:22": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-numbers-19-22"}],
  "Numbers 28:11": [{chapter: "18", title: "Appointed Times", anchor: "ref-numbers-28-11"}],
  "Numbers 28:11-15": [{chapter: "15", title: "Solar Only Calendars", anchor: "ref-numbers-28-11"}],
  "Numbers 29:1-6": [{chapter: "18", title: "Appointed Times", anchor: "ref-numbers-29-1"}],
  "Numbers 33:3": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-numbers-33-3"}, {chapter: "07", title: "When Does the Month Start", anchor: "ref-numbers-33-3"}, {chapter: "10", title: "When is the Sabbath", anchor: "ref-numbers-33-3"}],
  "Numbers 33:5": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-numbers-33-5"}, {chapter: "10", title: "When is the Sabbath", anchor: "ref-numbers-33-5"}],
  
  // Deuteronomy
  "Deuteronomy 4:2": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-deuteronomy-4-2"}, {chapter: "15", title: "Solar Only Calendars", anchor: "ref-deuteronomy-4-2"}],
  "Deuteronomy 4:19": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-deuteronomy-4-19"}, {chapter: "11", title: "The Day of Saturn", anchor: "ref-deuteronomy-4-19"}],
  "Deuteronomy 12:28": [{chapter: "17", title: "Commands to Follow", anchor: "ref-deuteronomy-12-28"}],
  "Deuteronomy 12:32": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-deuteronomy-12-32"}, {chapter: "15", title: "Solar Only Calendars", anchor: "ref-deuteronomy-12-32"}],
  "Deuteronomy 14:23": [{chapter: "18", title: "Appointed Times", anchor: "ref-deuteronomy-14-23"}],
  "Deuteronomy 15:1-2": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-deuteronomy-15-1"}],
  "Deuteronomy 15:1-3": [{chapter: "18", title: "Appointed Times", anchor: "ref-deuteronomy-15-1"}],
  "Deuteronomy 15:12": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-deuteronomy-15-12"}],
  "Deuteronomy 16:1": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-deuteronomy-16-1"}],
  "Deuteronomy 16:8": [{chapter: "18", title: "Appointed Times", anchor: "ref-deuteronomy-16-8"}],
  "Deuteronomy 16:9": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-deuteronomy-16-9"}],
  "Deuteronomy 17:2-3": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-deuteronomy-17-2"}],
  "Deuteronomy 17:6": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-deuteronomy-17-6"}],
  "Deuteronomy 17:7-8": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-deuteronomy-17-7"}],
  "Deuteronomy 17:9": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-deuteronomy-17-9"}],
  "Deuteronomy 17:11": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-deuteronomy-17-11"}],
  "Deuteronomy 19:15": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-deuteronomy-19-15"}, {chapter: "07", title: "When Does the Month Start", anchor: "ref-deuteronomy-19-15"}],
  "Deuteronomy 22:12": [{chapter: "19", title: "Miscellaneous Commands", anchor: "ref-deuteronomy-22-12"}],
  "Deuteronomy 30:11": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-deuteronomy-30-11"}],
  "Deuteronomy 30:11-14": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-deuteronomy-30-11"}, {chapter: "06", title: "When Does the Day Start", anchor: "ref-deuteronomy-30-11"}],
  "Deuteronomy 31:9": [{chapter: "18", title: "Appointed Times", anchor: "ref-deuteronomy-31-9"}],
  "Deuteronomy 31:10-11": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-deuteronomy-31-10"}],
  
  // Joshua
  "Joshua 2:6-7": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-joshua-2-6"}],
  "Joshua 3:5": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-joshua-3-5"}],
  "Joshua 5:10-12": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-joshua-5-10"}, {chapter: "18", title: "Appointed Times", anchor: "ref-joshua-5-10"}],
  
  // Judges
  "Judges 6:28": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-judges-6-28"}],
  "Judges 16:3": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-judges-16-3"}],
  
  // 1 Samuel
  "1 Samuel 8:1-3": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-1samuel-8-1"}],
  "1 Samuel 11:14": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-1samuel-11-14"}],
  "1 Samuel 19:11": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-1samuel-19-11"}],
  "1 Samuel 20:5": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-1samuel-20-5"}],
  
  // 1 Kings
  "1 Kings 6:1": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-1kings-6-1"}, {chapter: "12", title: "32 AD Resurrection", anchor: "ref-1kings-6-1"}],
  
  // 2 Kings
  "2 Kings 23:5": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-2kings-23-5"}],
  
  // 2 Chronicles
  "2 Chronicles 2:15": [{chapter: "18", title: "Appointed Times", anchor: "ref-2chronicles-2-15"}],
  "2 Chronicles 11:15": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-2chronicles-11-15"}],
  "2 Chronicles 15:8": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-2chronicles-15-8"}],
  "2 Chronicles 24:12": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-2chronicles-24-12"}],
  
  // Ezra
  "Ezra 7:7-9": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-ezra-7-7"}],
  
  // Nehemiah
  "Nehemiah 8:9": [{chapter: "18", title: "Appointed Times", anchor: "ref-nehemiah-8-9"}],
  "Nehemiah 8:13-18": [{chapter: "18", title: "Appointed Times", anchor: "ref-nehemiah-8-13"}],
  "Nehemiah 13:19-21": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-nehemiah-13-19"}],
  
  // Esther
  "Esther 5:14": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-esther-5-14"}],
  
  // Job
  "Job 38:33": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-job-38-33"}],
  
  // Psalms
  "Psalm 16:10": [{chapter: "14", title: "Passion Week", anchor: "ref-psalm-16-10"}],
  "Psalm 19:4-6": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-19-4"}, {chapter: "07", title: "When Does the Month Start", anchor: "ref-psalm-19-4"}, {chapter: "18", title: "Appointed Times", anchor: "ref-psalm-19-4"}],
  "Psalm 30:5": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-30-5"}],
  "Psalm 81:3": [{chapter: "15", title: "Solar Only Calendars", anchor: "ref-psalm-81-3"}, {chapter: "18", title: "Appointed Times", anchor: "ref-psalm-81-3"}],
  "Psalm 89:35-37": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-psalm-89-35"}],
  "Psalm 90:14": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-90-14"}],
  "Psalm 104:19": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-psalm-104-19"}, {chapter: "15", title: "Solar Only Calendars", anchor: "ref-psalm-104-19"}],
  "Psalm 119:89": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-119-89"}],
  "Psalm 119:105": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-119-105"}],
  "Psalm 119:142": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-psalm-119-142"}],
  "Psalm 139:11-12": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-139-11"}],
  "Psalm 143:8": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-psalm-143-8"}],
  "Psalms 19:1-4": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-psalms-19-1"}],
  "Psalms 51:10": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-psalms-51-10"}],
  "Psalms 81:3": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-psalms-81-3"}],
  "Psalms 104:19": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-psalms-104-19"}],
  "Psalms 104:30": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-psalms-104-30"}],
  "Psalms 136:8-9": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-psalms-136-8"}],
  
  // Proverbs
  "Proverbs 18:15": [{chapter: "01", title: "Introduction", anchor: "ref-proverbs-18-15"}],
  "Proverbs 18:17": [{chapter: "01", title: "Introduction", anchor: "ref-proverbs-18-17"}, {chapter: "03", title: "Principles of Evaluation", anchor: "ref-proverbs-18-17"}],
  "Proverbs 25:2": [{chapter: "18", title: "Appointed Times", anchor: "ref-proverbs-25-2"}],
  "Proverbs 30:5": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-proverbs-30-5"}],
  
  // Ecclesiastes
  "Ecclesiastes 8:17": [{chapter: "01", title: "Introduction", anchor: "ref-ecclesiastes-8-17"}],
  "Ecclesiastes 12:1-2": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-ecclesiastes-12-1"}],
  
  // Isaiah
  "Isaiah 1:13-14": [{chapter: "18", title: "Appointed Times", anchor: "ref-isaiah-1-13"}],
  "Isaiah 8:20": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-isaiah-8-20"}],
  "Isaiah 33:22": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-isaiah-33-22"}],
  "Isaiah 40:22": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-isaiah-40-22"}],
  "Isaiah 43:19": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-isaiah-43-19"}],
  "Isaiah 45:7": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-isaiah-45-7"}],
  "Isaiah 47:13-14": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-isaiah-47-13"}],
  "Isaiah 53:5": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-isaiah-53-5"}],
  "Isaiah 61:1-3": [{chapter: "18", title: "Appointed Times", anchor: "ref-isaiah-61-1"}],
  "Isaiah 61:4": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-isaiah-61-4"}],
  "Isaiah 66:16-17": [{chapter: "19", title: "Miscellaneous Commands", anchor: "ref-isaiah-66-16"}],
  "Isaiah 66:22-23": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-isaiah-66-22"}],
  "Isaiah 66:23": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-isaiah-66-23"}],
  
  // Jeremiah
  "Jeremiah 16:19": [{chapter: "01", title: "Introduction", anchor: "ref-jeremiah-16-19"}, {chapter: "18", title: "Appointed Times", anchor: "ref-jeremiah-16-19"}],
  "Jeremiah 17:24-27": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-jeremiah-17-24"}],
  "Jeremiah 17:27": [{chapter: "18", title: "Appointed Times", anchor: "ref-jeremiah-17-27"}],
  "Jeremiah 31:12": [{chapter: "18", title: "Appointed Times", anchor: "ref-jeremiah-31-12"}],
  "Jeremiah 31:31-33": [{chapter: "17", title: "Commands to Follow", anchor: "ref-jeremiah-31-31"}],
  "Jeremiah 52:12-13": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-jeremiah-52-12"}],
  
  // Lamentations
  "Lamentations 3:22-23": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-lamentations-3-22"}],
  
  // Ezekiel
  "Ezekiel 5:5": [{chapter: "05", title: "Where Does the Day Start", anchor: "ref-ezekiel-5-5"}],
  "Ezekiel 20:12": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-ezekiel-20-12"}],
  "Ezekiel 20:20": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-ezekiel-20-20"}, {chapter: "18", title: "Appointed Times", anchor: "ref-ezekiel-20-20"}],
  "Ezekiel 20:24": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-ezekiel-20-24"}],
  "Ezekiel 33:13": [{chapter: "17", title: "Commands to Follow", anchor: "ref-ezekiel-33-13"}],
  "Ezekiel 36:26": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-ezekiel-36-26"}],
  "Ezekiel 38:12": [{chapter: "14", title: "Passion Week", anchor: "ref-ezekiel-38-12"}],
  "Ezekiel 46:1": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-ezekiel-46-1"}, {chapter: "18", title: "Appointed Times", anchor: "ref-ezekiel-46-1"}],
  "Ezekiel 46:1-3": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-ezekiel-46-1"}, {chapter: "15", title: "Solar Only Calendars", anchor: "ref-ezekiel-46-1"}],
  
  // Daniel
  "Daniel 7:25": [{chapter: "02", title: "Inherited Lies", anchor: "ref-daniel-7-25"}, {chapter: "03", title: "Principles of Evaluation", anchor: "ref-daniel-7-25"}],
  "Daniel 8:14": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-daniel-8-14"}],
  "Daniel 9:24": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-daniel-9-24"}],
  "Daniel 9:25": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-daniel-9-25"}],
  
  // Hosea
  "Hosea 2:8": [{chapter: "18", title: "Appointed Times", anchor: "ref-hosea-2-8"}],
  "Hosea 2:11": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-hosea-2-11"}],
  "Hosea 2:16-17": [{chapter: "01", title: "Introduction", anchor: "ref-hosea-2-16"}],
  "Hosea 4:6": [{chapter: "01", title: "Introduction", anchor: "ref-hosea-4-6"}],
  "Hosea 12:9": [{chapter: "18", title: "Appointed Times", anchor: "ref-hosea-12-9"}],
  
  // Joel
  "Joel 2:24": [{chapter: "18", title: "Appointed Times", anchor: "ref-joel-2-24"}],
  
  // Amos
  "Amos 5:26": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-amos-5-26"}],
  "Amos 8:5": [{chapter: "18", title: "Appointed Times", anchor: "ref-amos-8-5"}],
  "Amos 8:9": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-amos-8-9"}, {chapter: "12", title: "32 AD Resurrection", anchor: "ref-amos-8-9"}],
  
  // Zechariah
  "Zechariah 14:16-19": [{chapter: "18", title: "Appointed Times", anchor: "ref-zechariah-14-16"}],
  
  // Malachi
  "Malachi 3:6": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-malachi-3-6"}],
  
  // Matthew
  "Matthew 5:17-19": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-matthew-5-17"}],
  "Matthew 5:17-20": [{chapter: "17", title: "Commands to Follow", anchor: "ref-matthew-5-17"}],
  "Matthew 5:18": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-matthew-5-18"}],
  "Matthew 6:14": [{chapter: "19", title: "Miscellaneous Commands", anchor: "ref-matthew-6-14"}],
  "Matthew 6:20-21": [{chapter: "17", title: "Commands to Follow", anchor: "ref-matthew-6-20"}],
  "Matthew 6:26": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-matthew-6-26"}],
  "Matthew 6:34": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-matthew-6-34"}],
  "Matthew 7:21": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-matthew-7-21"}],
  "Matthew 7:22-23": [{chapter: "01", title: "Introduction", anchor: "ref-matthew-7-22"}, {chapter: "16", title: "The Path to Salvation", anchor: "ref-matthew-7-22"}],
  "Matthew 10:33": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-matthew-10-33"}],
  "Matthew 12:38-40": [{chapter: "14", title: "Passion Week", anchor: "ref-matthew-12-38"}],
  "Matthew 15:3-9": [{chapter: "02", title: "Inherited Lies", anchor: "ref-matthew-15-3"}],
  "Matthew 16:6": [{chapter: "17", title: "Commands to Follow", anchor: "ref-matthew-16-6"}],
  "Matthew 16:12": [{chapter: "17", title: "Commands to Follow", anchor: "ref-matthew-16-12"}],
  "Matthew 16:21": [{chapter: "14", title: "Passion Week", anchor: "ref-matthew-16-21"}],
  "Matthew 16:24-26": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-matthew-16-24"}],
  "Matthew 17:23": [{chapter: "14", title: "Passion Week", anchor: "ref-matthew-17-23"}],
  "Matthew 18:16": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-matthew-18-16"}],
  "Matthew 20:19": [{chapter: "14", title: "Passion Week", anchor: "ref-matthew-20-19"}],
  "Matthew 22:36-40": [{chapter: "19", title: "Miscellaneous Commands", anchor: "ref-matthew-22-36"}],
  "Matthew 23:13": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-matthew-23-13"}],
  "Matthew 23:23": [{chapter: "17", title: "Commands to Follow", anchor: "ref-matthew-23-23"}],
  "Matthew 23:34-40": [{chapter: "17", title: "Commands to Follow", anchor: "ref-matthew-23-34"}],
  "Matthew 27:45": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-matthew-27-45"}, {chapter: "14", title: "Passion Week", anchor: "ref-matthew-27-45"}],
  "Matthew 27:45-50": [{chapter: "14", title: "Passion Week", anchor: "ref-matthew-27-45"}],
  "Matthew 28:1": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-matthew-28-1"}],
  
  // Mark
  "Mark 7:6-13": [{chapter: "02", title: "Inherited Lies", anchor: "ref-mark-7-6"}],
  "Mark 7:13": [{chapter: "02", title: "Inherited Lies", anchor: "ref-mark-7-13"}, {chapter: "15", title: "Solar Only Calendars", anchor: "ref-mark-7-13"}],
  "Mark 8:31": [{chapter: "14", title: "Passion Week", anchor: "ref-mark-8-31"}],
  "Mark 9:31": [{chapter: "14", title: "Passion Week", anchor: "ref-mark-9-31"}],
  "Mark 10:34": [{chapter: "14", title: "Passion Week", anchor: "ref-mark-10-34"}],
  "Mark 16:1": [{chapter: "14", title: "Passion Week", anchor: "ref-mark-16-1"}],
  "Mark 16:1-2": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-mark-16-1"}],
  
  // Luke
  "Luke 2:1-5": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-luke-2-1"}],
  "Luke 2:2": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-luke-2-2"}],
  "Luke 3:1-2": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-luke-3-1"}],
  "Luke 4:14": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-luke-4-14"}],
  "Luke 4:18-19": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-luke-4-18"}],
  "Luke 4:28-30": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-luke-4-28"}],
  "Luke 6:40": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-luke-6-40"}],
  "Luke 8:14": [{chapter: "symbols", title: "Symbol: THORNS", anchor: "ref-luke-8-14"}],
  "Luke 9:22": [{chapter: "14", title: "Passion Week", anchor: "ref-luke-9-22"}],
  "Luke 9:26": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-luke-9-26"}],
  "Luke 13:32": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-luke-13-32"}],
  "Luke 17:9-10": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-luke-17-9"}],
  "Luke 18:33": [{chapter: "14", title: "Passion Week", anchor: "ref-luke-18-33"}],
  "Luke 22:18-20": [{chapter: "18", title: "Appointed Times", anchor: "ref-luke-22-18"}],
  "Luke 23:44-46": [{chapter: "14", title: "Passion Week", anchor: "ref-luke-23-44"}],
  "Luke 23:55-56": [{chapter: "14", title: "Passion Week", anchor: "ref-luke-23-55"}],
  "Luke 24:1": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-luke-24-1"}],
  "Luke 24:13": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-luke-24-13"}],
  "Luke 24:19-21": [{chapter: "14", title: "Passion Week", anchor: "ref-luke-24-19"}],
  "Luke 24:33": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-luke-24-33"}],
  "Luke 24:46": [{chapter: "14", title: "Passion Week", anchor: "ref-luke-24-46"}],
  
  // John
  "John 1:1-3": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-john-1-1"}],
  "John 1:5": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-john-1-5"}],
  "John 2:13": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-john-2-13"}],
  "John 2:18": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-john-2-18"}],
  "John 2:20": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-john-2-20"}],
  "John 5:14": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-john-5-14"}],
  "John 5:19": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-john-5-19"}],
  "John 5:30": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-john-5-30"}],
  "John 6:38": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-john-6-38"}],
  "John 8:11": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-john-8-11"}],
  "John 8:12": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-john-8-12"}, {chapter: "16", title: "The Path to Salvation", anchor: "ref-john-8-12"}],
  "John 8:34": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-john-8-34"}],
  "John 8:44": [{chapter: "02", title: "Inherited Lies", anchor: "ref-john-8-44"}],
  "John 10:35": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-john-10-35"}],
  "John 11:9": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-john-11-9"}, {chapter: "08", title: "When Does the Year Start", anchor: "ref-john-11-9"}],
  "John 11:39": [{chapter: "14", title: "Passion Week", anchor: "ref-john-11-39"}],
  "John 12:1": [{chapter: "08", title: "When Does the Year Start", anchor: "ref-john-12-1"}],
  "John 20:1": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-john-20-1"}],
  "John 20:19": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-john-20-19"}],
  
  // Acts
  "Acts 2:27": [{chapter: "14", title: "Passion Week", anchor: "ref-acts-2-27"}],
  "Acts 2:31": [{chapter: "14", title: "Passion Week", anchor: "ref-acts-2-31"}],
  "Acts 2:41": [{chapter: "18", title: "Appointed Times", anchor: "ref-acts-2-41"}],
  "Acts 4:19-20": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-acts-4-19"}],
  "Acts 5:29": [{chapter: "04", title: "Alleged Authority of Sanhedrin", anchor: "ref-acts-5-29"}],
  "Acts 7:43": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-acts-7-43"}],
  "Acts 10:39-40": [{chapter: "14", title: "Passion Week", anchor: "ref-acts-10-39"}],
  "Acts 13:35-37": [{chapter: "14", title: "Passion Week", anchor: "ref-acts-13-35"}],
  "Acts 17:30": [{chapter: "01", title: "Introduction", anchor: "ref-acts-17-30"}],
  
  // Romans
  "Romans 3:4": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-romans-3-4"}],
  "Romans 3:23": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-3-23"}],
  "Romans 6:23": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-6-23"}],
  "Romans 7:7": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-7-7"}],
  "Romans 7:12": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-7-12"}],
  "Romans 7:15": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-7-15"}],
  "Romans 7:16": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-7-16"}],
  "Romans 7:16-25": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-7-16"}],
  "Romans 10:9": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-romans-10-9"}],
  "Romans 11:17-24": [{chapter: "17", title: "Commands to Follow", anchor: "ref-romans-11-17"}],
  "Romans 11:19-22": [{chapter: "17", title: "Commands to Follow", anchor: "ref-romans-11-19"}],
  
  // 1 Corinthians
  "1 Corinthians 15:1-4": [{chapter: "14", title: "Passion Week", anchor: "ref-1corinthians-15-1"}],
  "1 Corinthians 15:20": [{chapter: "10", title: "When is the Sabbath", anchor: "ref-1corinthians-15-20"}, {chapter: "14", title: "Passion Week", anchor: "ref-1corinthians-15-20"}, {chapter: "18", title: "Appointed Times", anchor: "ref-1corinthians-15-20"}],
  
  // 2 Corinthians
  "2 Corinthians 14:1": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-2corinthians-14-1"}],
  
  // Galatians
  "Galatians 3:28": [{chapter: "17", title: "Commands to Follow", anchor: "ref-galatians-3-28"}],
  
  // Ephesians
  "Ephesians 2:8-10": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-ephesians-2-8"}, {chapter: "16", title: "The Path to Salvation", anchor: "ref-ephesians-2-8"}],
  "Ephesians 4:17-20": [{chapter: "17", title: "Commands to Follow", anchor: "ref-ephesians-4-17"}],
  
  // Colossians
  "Colossians 2:8": [{chapter: "02", title: "Inherited Lies", anchor: "ref-colossians-2-8"}, {chapter: "03", title: "Principles of Evaluation", anchor: "ref-colossians-2-8"}],
  
  // 1 Timothy
  "1 Timothy 5:19": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-1timothy-5-19"}],
  
  // 2 Timothy
  "2 Timothy 3:16-17": [{chapter: "17", title: "Commands to Follow", anchor: "ref-2timothy-3-16"}],
  
  // Titus
  "Titus 1:13-14": [{chapter: "02", title: "Inherited Lies", anchor: "ref-titus-1-13"}],
  "Titus 1:14": [{chapter: "02", title: "Inherited Lies", anchor: "ref-titus-1-14"}],
  
  // Hebrews
  "Hebrews 4:14": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-hebrews-4-14"}],
  "Hebrews 8:5": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-hebrews-8-5"}],
  "Hebrews 10:26-27": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-hebrews-10-26"}],
  "Hebrews 10:28": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-hebrews-10-28"}],
  "Hebrews 10:28-31": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-hebrews-10-28"}],
  "Hebrews 10:29": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-hebrews-10-29"}],
  "Hebrews 13:8": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-hebrews-13-8"}, {chapter: "17", title: "Commands to Follow", anchor: "ref-hebrews-13-8"}],
  
  // James
  "James 1:17": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-james-1-17"}],
  "James 4:12": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-james-4-12"}],
  
  // 1 John
  "1 John 1:5": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-1john-1-5"}],
  "1 John 2:2": [{chapter: "12", title: "32 AD Resurrection", anchor: "ref-1john-2-2"}],
  "1 John 2:4-7": [{chapter: "17", title: "Commands to Follow", anchor: "ref-1john-2-4"}],
  "1 John 3:4": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-1john-3-4"}],
  "1 John 3:4-6": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-1john-3-4"}],
  "1 John 4:3": [{chapter: "02", title: "Inherited Lies", anchor: "ref-1john-4-3"}, {chapter: "18", title: "Appointed Times", anchor: "ref-1john-4-3"}],
  "1 John 5:3": [{chapter: "17", title: "Commands to Follow", anchor: "ref-1john-5-3"}],
  
  // Revelation
  "Revelation 2:5": [{chapter: "16", title: "The Path to Salvation", anchor: "ref-revelation-2-5"}],
  "Revelation 6:6": [{chapter: "18", title: "Appointed Times", anchor: "ref-revelation-6-6"}],
  "Revelation 13:18": [{chapter: "11", title: "The Day of Saturn", anchor: "ref-revelation-13-18"}],
  "Revelation 14:12": [{chapter: "15", title: "Solar Only Calendars", anchor: "ref-revelation-14-12"}],
  "Revelation 21:12": [{chapter: "07", title: "When Does the Month Start", anchor: "ref-revelation-21-12"}],
  "Revelation 21:23": [{chapter: "06", title: "When Does the Day Start", anchor: "ref-revelation-21-23"}],
  "Revelation 22:18-19": [{chapter: "03", title: "Principles of Evaluation", anchor: "ref-revelation-22-18"}, {chapter: "15", title: "Solar Only Calendars", anchor: "ref-revelation-22-18"}]
};

// Chapter number to chapterId mapping for v2 navigation
const CHAPTER_ID_MAP = {
  "01": "01_Introduction",
  "02": "02_Inherited_Lies",
  "03": "03_Principles_of_Evaluation",
  "04": "04_Alleged_Authority_of_Sanhedrin",
  "05": "05_Where_Does_the_Day_Start",
  "06": "06_When_Does_the_Day_Start",
  "07": "07_When_Does_the_Month_Start",
  "08": "08_When_does_the_Year_Start",
  "09": "09_How_to_Observe_the_Signs",
  "10": "10_When_is_the_Sabbath",
  "11": "11_The_Day_of_Saturn",
  "12": "12_32_AD_Resurrection",
  "13": "13_Herod_the_Great",
  "14": "14_Passion_Week_3_Days_3_Nights",
  "15": "15_Solar_Only_Calendars",
  "16": "16_The_Path_to_Salvation",
  "17": "17_Commands_to_Follow",
  "18": "18_Appointed_Times",
  "19": "19_Miscellaneous_Commands"
};

// Helper function to normalize a verse reference for lookup
function normalizeReference(ref) {
  // Handle variations like "Psalm" vs "Psalms", normalize spacing
  return ref.trim()
    .replace(/^Psalm\s/, 'Psalms ')
    .replace(/^Song of Songs/, 'Song of Solomon');
}

// Look up book references for a verse
function getBookReferences(book, chapter, verse) {
  // Try exact match first
  const exactRef = `${book} ${chapter}:${verse}`;
  if (BOOK_SCRIPTURE_INDEX[exactRef]) {
    return BOOK_SCRIPTURE_INDEX[exactRef];
  }
  
  // Try to find verse within a range
  const results = [];
  for (const [ref, locations] of Object.entries(BOOK_SCRIPTURE_INDEX)) {
    // Check if this reference matches our book and chapter
    const match = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) continue;
    
    const [, refBook, refChapter, startVerse, endVerse] = match;
    if (normalizeReference(refBook) !== normalizeReference(book)) continue;
    if (parseInt(refChapter) !== parseInt(chapter)) continue;
    
    const start = parseInt(startVerse);
    const end = endVerse ? parseInt(endVerse) : start;
    const v = parseInt(verse);
    
    if (v >= start && v <= end) {
      results.push(...locations);
    }
  }
  
  return results.length > 0 ? results : null;
}

// Build chapter URL for v2 navigation
// Returns an onclick handler string for AppStore navigation
function getChapterUrl(chapterNum, anchor) {
  const chapterId = CHAPTER_ID_MAP[chapterNum];
  if (!chapterId) return null;
  
  // Return URL path for href attribute
  return `/reader/timetested/${chapterId}${anchor ? '#' + anchor : ''}`;
}

// Navigate to a book chapter (called from popup links)
function navigateToBookChapter(chapterNum, anchor) {
  const chapterId = CHAPTER_ID_MAP[chapterNum];
  if (!chapterId) return;
  
  // Use AppStore navigation
  AppStore.dispatch({
    type: 'SET_VIEW',
    view: 'reader',
    params: { contentType: 'timetested', chapterId: chapterId }
  });
  
  // Scroll to anchor after content loads
  if (anchor) {
    setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }
}
