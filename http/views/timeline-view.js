/**
 * TimelineView - Biblical timeline visualization
 * Uses biblical-timeline.js for rendering
 * 
 * UNIDIRECTIONAL FLOW:
 * - User action → dispatch to AppStore → URL updates → render from state
 * - All panel state derived from: timelineEventId, timelineDurationId, timelineSearch
 */

const TimelineView = {
  initialized: false,
  lastProfileId: null,
  lastRenderedEventId: null,
  lastRenderedDurationId: null,
  lastRenderedSearch: null,
  lastRenderedZoom: null,
  lastRenderedYear: null,
  
  init() {
    console.log('[TimelineView] init');
    this.initialized = false;
    this.lastProfileId = null;
  },
  
  cleanup() {
    console.log('[TimelineView] cleanup');
    this.initialized = false;
    this.lastProfileId = null;
    this.lastRenderedEventId = null;
    this.lastRenderedDurationId = null;
    this.lastRenderedSearch = null;
    this.lastRenderedZoom = null;
    this.lastRenderedYear = null;
    
    // Remove detail panel from DOM
    const panel = document.getElementById('detail-slideout-panel');
    if (panel) {
      panel.remove();
    }
    document.body.classList.remove('detail-panel-open');
  },
  
  render(state, derived, container) {
    const currentProfileId = state.context.profileId;
    const needsFullRender = !this.initialized || 
                            this.lastProfileId !== currentProfileId ||
                            !document.getElementById('biblical-timeline-page');
    
    // Only do full re-render when necessary (profile change or first render)
    if (needsFullRender) {
      console.log('[TimelineView] Full render');
      
      // Sync global state before rendering
      if (typeof syncGlobalState === 'function') {
        syncGlobalState();
      }
      
      // Create the timeline container structure
      container.innerHTML = `
        <div id="biblical-timeline-page" class="biblical-timeline-page" style="display: flex; position: relative; top: 0; left: 0; right: 0; bottom: 0; height: calc(100vh - var(--top-nav-height, 56px) - 20px);">
          <div class="biblical-timeline-header" style="display: none;">
            <h2>Biblical Timeline</h2>
          </div>
          <div id="biblical-timeline-vis-container" class="biblical-timeline-vis-container">
            <div class="biblical-timeline-loading">Loading timeline...</div>
          </div>
        </div>
      `;
      
      // Render timeline and then sync panel state from URL
      const renderAndSync = async () => {
        if (typeof renderBiblicalTimeline === 'function') {
          await renderBiblicalTimeline();
          
          if (typeof initBiblicalTimelinePage === 'function') {
            initBiblicalTimelinePage();
          }
          
          // Sync panel state from URL after render completes
          setTimeout(() => this.syncPanelFromState(state.ui), 300);
        }
      };
      
      if (typeof renderBiblicalTimeline === 'function') {
        requestAnimationFrame(() => renderAndSync());
      } else if (typeof loadBiblicalTimelineData === 'function') {
        loadBiblicalTimelineData().then(() => renderAndSync());
      }
      
      this.initialized = true;
      this.lastProfileId = currentProfileId;
      this.lastRenderedEventId = state.ui.timelineEventId;
      this.lastRenderedDurationId = state.ui.timelineDurationId;
      this.lastRenderedSearch = state.ui.timelineSearch;
      this.lastRenderedZoom = state.ui.timelineZoom;
      this.lastRenderedYear = state.ui.timelineCenterYear;
      
    } else {
      // Lightweight update - sync panel and view based on state changes
      const eventChanged = state.ui.timelineEventId !== this.lastRenderedEventId;
      const durationChanged = state.ui.timelineDurationId !== this.lastRenderedDurationId;
      const searchChanged = state.ui.timelineSearch !== this.lastRenderedSearch;
      const zoomChanged = state.ui.timelineZoom !== this.lastRenderedZoom;
      const yearChanged = state.ui.timelineCenterYear !== this.lastRenderedYear;
      
      // Sync zoom and scroll position (if changed) - BUT skip if search is changing
      // because showSearchResultsFromState will handle zoom for search
      if ((zoomChanged || yearChanged) && !searchChanged) {
        if (typeof syncTimelineZoomAndPosition === 'function') {
          syncTimelineZoomAndPosition(state.ui.timelineZoom, state.ui.timelineCenterYear);
        }
        this.lastRenderedZoom = state.ui.timelineZoom;
        this.lastRenderedYear = state.ui.timelineCenterYear;
      }
      
      // Then sync panel state
      if (eventChanged || durationChanged || searchChanged) {
        this.syncPanelFromState(state.ui);
        this.lastRenderedEventId = state.ui.timelineEventId;
        this.lastRenderedDurationId = state.ui.timelineDurationId;
        this.lastRenderedSearch = state.ui.timelineSearch;
        // Also update zoom/year tracking when search changes (search sets its own zoom)
        if (searchChanged) {
          this.lastRenderedZoom = state.ui.timelineZoom;
          this.lastRenderedYear = state.ui.timelineCenterYear;
        }
      }
    }
  },
  
  /**
   * Sync ALL UI from state (true unidirectional flow)
   * ALL UI reads from state - no imperative manipulation elsewhere
   */
  syncPanelFromState(ui) {
    if (!ui) return;
    
    // 1. Sync search input value from state
    const searchInput = document.getElementById('biblical-timeline-search');
    if (searchInput) {
      const stateSearch = ui.timelineSearch || '';
      if (searchInput.value !== stateSearch) {
        searchInput.value = stateSearch;
      }
    }
    
    // 2. Determine panel content from state (mutually exclusive)
    // Priority: eventId > durationId > search > nothing
    if (ui.timelineEventId) {
      if (typeof showEventDetailFromState === 'function') {
        showEventDetailFromState(ui.timelineEventId);
      }
    } else if (ui.timelineDurationId) {
      if (typeof showDurationDetailFromState === 'function') {
        showDurationDetailFromState(ui.timelineDurationId);
      }
    } else if (ui.timelineSearch) {
      if (typeof showSearchResultsFromState === 'function') {
        showSearchResultsFromState(ui.timelineSearch);
      }
    } else {
      // Nothing selected - close panel
      if (typeof closeDetailPanelFromState === 'function') {
        closeDetailPanelFromState();
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimelineView;
}
