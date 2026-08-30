/*
  Customer package install slot.

  Replace this file with the JavaScript package your client gives you, or paste
  their loader code below. The landing page calls MATCH_LANDING_HOOKS.onTrack
  for PageView, StartMatch, MatchComplete, CtaClick, and Lead events.
*/

window.MATCH_LANDING_HOOKS = window.MATCH_LANDING_HOOKS || {
  onTrack(eventName, payload) {
    console.info("[customer-package-hook]", eventName, payload);
  }
};
