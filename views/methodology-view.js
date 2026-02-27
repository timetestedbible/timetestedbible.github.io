/**
 * Methodology View — "How We Study"
 * Bible study methodology guide: why Scripture requires deep study,
 * how to use the tools, and one application (the calendar).
 */
const MethodologyView = {
  render(state, derived, container) {
    container.innerHTML = `
      <div class="methodology-view">

        <!-- 1. HERO -->
        <section class="method-hero">
          <h1>How We Study</h1>
          <p class="method-hero-intro">
            Don't take anyone's word for it — not ours, not your pastor's, not your seminary's. 
            Go to the original text, trace the words, test the symbols, and verify the sources yourself.
          </p>
        </section>

        <!-- 2. WHY DIG DEEPER -->
        <section class="method-section">
          <h2>Why Dig Deeper? Scripture Says So.</h2>
          <p>
            Scripture is intentionally written in parables, dark sayings, and symbolic language — not plainly. 
            The surface meaning is accessible to everyone, but the deeper meaning — the symbolic and parabolic layer — 
            requires digging. This isn't a flaw; it's the design. The Creator conceals, and those who love truth search it out.
          </p>

          <div class="method-verse-grid">
            <blockquote class="method-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'Psalms',chapter:78}})">
              "I will open my mouth in a parable; I will utter dark sayings of old."
              <cite>— Psalm 78:2</cite>
            </blockquote>
            <blockquote class="method-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'Matthew',chapter:13}})">
              "All these things spake Jesus unto the multitude in parables; and without a parable spake he not unto them."
              <cite>— Matthew 13:34</cite>
            </blockquote>
            <blockquote class="method-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'Proverbs',chapter:25}})">
              "It is the glory of God to conceal a matter, but the glory of kings is to search it out."
              <cite>— Proverbs 25:2</cite>
            </blockquote>
            <blockquote class="method-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'John',chapter:16}})">
              "These things have I spoken unto you in proverbs: but the time cometh, when I shall no more speak unto you in proverbs, but I shall shew you plainly of the Father."
              <cite>— John 16:25</cite>
            </blockquote>
            <blockquote class="method-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'Luke',chapter:8}})">
              "Unto you it is given to know the mysteries of the kingdom of God: but to others in parables; that seeing they might not see, and hearing they might not understand."
              <cite>— Luke 8:10</cite>
            </blockquote>
            <blockquote class="method-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'1Thessalonians',chapter:5}})">
              "Test everything; hold fast what is good."
              <cite>— 1 Thessalonians 5:21</cite>
            </blockquote>
          </div>

          <p>
            This app is built for the kind of study Scripture demands — tools to peel back the layers, 
            trace the original language, and discover what's been concealed in plain sight.
          </p>
        </section>

        <!-- 3. WORD STUDIES -->
        <section class="method-section">
          <h2>Word Studies</h2>
          <div class="method-content">
            <p>
              Every English word in your Bible hides a Hebrew or Greek original with a specific, traceable meaning. 
              Translators made choices — sometimes the same Hebrew word becomes "love" in one verse and "mercy" in another. 
              Those choices shape what you think the text means.
            </p>
            <div class="method-features">
              <div class="method-feature">
                <strong>Enhanced Strong's/BDB Lexicon</strong> — Tap any word to see its Strong's number, full BDB definition, transliteration, pronunciation, and derivation. Goes deeper than basic Strong's.
              </div>
              <div class="method-feature">
                <strong>Every Occurrence</strong> — See every verse where the same Hebrew/Greek word appears, regardless of how it was translated into English. Find patterns translators obscured.
              </div>
              <div class="method-feature">
                <strong>Interlinear Display</strong> — Toggle interlinear mode to see the Hebrew or Greek text underneath each English word. No need to know the language — the tools do the heavy lifting.
              </div>
            </div>
            <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
              Open Bible Reader →
            </button>
          </div>
        </section>

        <!-- 4. SYMBOL STUDIES -->
        <section class="method-section">
          <h2>Symbol Studies</h2>
          <div class="method-content">
            <p>
              Scripture uses consistent symbolic language — trees, mountains, water, fire, sheep, goats, rocks — 
              that carry the same meaning everywhere they appear. These aren't random metaphors. 
              They're a symbolic vocabulary the Creator embedded throughout the text.
            </p>
            <div class="method-features">
              <div class="method-feature">
                <strong>The Substitution Test</strong> — Identify a candidate meaning from a clear passage, then substitute it into every occurrence of that symbol across all of Scripture. If it produces coherent meaning everywhere, you've found it.
              </div>
              <div class="method-feature">
                <strong>Cross-Testament Consistency</strong> — True symbolic meanings work in both Old and New Testaments. A symbol that only works in one place isn't a symbol — it's a guess.
              </div>
              <div class="method-feature">
                <strong>Symbol Dictionary</strong> — Browse the growing dictionary of identified symbols with their meanings, supporting verses, and substitution tests already performed.
              </div>
            </div>
            <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
              Explore Symbol Dictionary →
            </button>
          </div>
        </section>

        <!-- 5. VERSE STUDIES -->
        <section class="method-section">
          <h2>Verse Studies</h2>
          <div class="method-content">
            <p>
              No single translation tells the whole story. Where translations agree, you can be confident. 
              Where they diverge, that's where the original language holds the answer.
            </p>
            <div class="method-features">
              <div class="method-feature">
                <strong>10 Translations Side by Side</strong> — KJV, ASV, AKJV, YLT, WEB, and more. Instantly see where translators agreed and where they made different choices.
              </div>
              <div class="method-feature">
                <strong>Verse Annotations</strong> — Layered notes connect related passages. Follow the threads across books without losing your place.
              </div>
              <div class="method-feature">
                <strong>Divine Name Preferences</strong> — Choose how the divine name appears — 𐤉𐤄𐤅𐤄, YHWH, Yahweh, Yahuah, LORD, and more — applied across every translation. See how it changes the reading.
              </div>
            </div>
            <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible'}})">
              Open Bible Reader →
            </button>
          </div>
        </section>

        <!-- 6. PRIMARY SOURCES -->
        <section class="method-section">
          <h2>Primary Sources</h2>
          <div class="method-content">
            <p>
              Philo of Alexandria and Flavius Josephus are the most important extra-biblical witnesses to how Scripture 
              was understood in the Second Temple period. We include their complete works — not cherry-picked quotes — 
              so you can read the full context and judge for yourself.
            </p>
            <div class="method-features">
              <div class="method-feature">
                <strong>Full Text, Not Fragments</strong> — Complete works of Philo (allegorical Torah commentaries) and Josephus (Antiquities, Jewish War, Against Apion, Life). Read the source, not someone's summary.
              </div>
              <div class="method-feature">
                <strong>Inline Citation Linking</strong> — References in the book and word studies link directly to the source passage. One tap to verify any claim against the primary text.
              </div>
            </div>
            <div class="method-verse-inline" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'Acts',chapter:17}})">
              "They searched the Scriptures daily to see whether those things were so." — Acts 17:11
            </div>
            <div class="method-btn-row">
              <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'philo'}})">
                Browse Philo →
              </button>
              <button class="method-btn secondary" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'josephus'}})">
                Browse Josephus →
              </button>
            </div>
          </div>
        </section>

        <!-- 7. SEARCH -->
        <section class="method-section">
          <h2>Search — Your Research Tool</h2>
          <div class="method-content">
            <p>
              The global search bar ties all of these study methods together. Everything is indexed locally 
              for instant results — no internet required.
            </p>
            <div class="method-features">
              <div class="method-feature">
                <strong>Verse Lookup</strong> — Type "John 3:16" or "Gen 1:1" to jump directly to any verse.
              </div>
              <div class="method-feature">
                <strong>Strong's Number Search</strong> — Type "H3068" to find every occurrence of a Hebrew word across all translations.
              </div>
              <div class="method-feature">
                <strong>Keyword Search</strong> — Search any word or phrase across all translations simultaneously.
              </div>
              <div class="method-feature">
                <strong>Symbol Search</strong> — Find symbol studies and their scriptural references.
              </div>
            </div>
            <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'help'})">
              Full Search Guide →
            </button>
          </div>
        </section>

        <!-- 8. HERMENEUTICS CRITIQUE -->
        <section class="method-section">
          <h2>Don't Trust "Proper Hermeneutics"</h2>
          <div class="method-content">
            <p>
              "You just don't understand proper hermeneutical principles." If you've studied Scripture independently, 
              you've probably heard this line. It's a thought-terminating cliche designed to shut down inquiry, not open it.
            </p>
            <p>
              Rabbinic middot (the 13 rules of Rabbi Yishmael) and seminary hermeneutical frameworks are 
              <em>interpretive choices</em>, not objective science. They're presented as universal keys to unlock 
              Scripture, but in practice they're often used to protect inherited conclusions from contradictory evidence.
            </p>
            <p>
              The antidote isn't a better set of rules — it's going to the text yourself with original language tools, 
              testing every claim, and refusing to let any human authority override what you can verify directly.
            </p>
            <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested',chapterId:'03_Principles_of_Evaluation'}})">
              Read the Full Critique →
            </button>
          </div>
        </section>

        <!-- 9. APPLYING THE METHOD -->
        <section class="method-section method-application">
          <h2>Applying the Method: The Calendar Question</h2>
          <div class="method-content">
            <p>
              Everything above — word studies, symbol analysis, primary sources, testing claims — 
              is exactly what we applied to one of the most debated questions in Scripture: 
              <em>when are the appointed times?</em>
            </p>
            <p>
              The book <strong>A Time-Tested Tradition</strong> documents that investigation. It uses the 
              "map vs territory" principle: a calendar is a map of time, and 𐤉𐤄𐤅𐤄's appointed times are the 
              physical reality. To test a map, you find known landmarks first — then see which maps match.
            </p>
            <p>
              The Sabbath Tester in this app lets you run that test yourself with any calendar configuration 
              against astronomically dated biblical events. The calendar is one application of the methodology, 
              not the methodology itself.
            </p>
            <div class="method-btn-row">
              <button class="method-btn" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'timetested'}})">
                Read the Book →
              </button>
              <button class="method-btn secondary" onclick="AppStore.dispatch({type:'SET_VIEW',view:'sabbath-tester'})">
                Run Sabbath Tester →
              </button>
            </div>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="method-footer">
          <div class="method-footer-verse" onclick="AppStore.dispatch({type:'SET_VIEW',view:'reader',params:{contentType:'bible',translation:getDefaultTranslation(),book:'Proverbs',chapter:25}})">
            <p>"It is the glory of God to conceal a matter, but the glory of kings is to search it out."</p>
            <cite>— Proverbs 25:2</cite>
          </div>
        </footer>
      </div>
    `;
  },

  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
