// ==UserScript==
// @name         Redgifs media controls
// @namespace    http://tampermonkey.net/
// @version      2.1.5
// @description  Adds media controls for Redgifs (dynamic player tracking for normal pages)
// @author       You (with Grok tweaks)
// @match        https://www.redgifs.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=redgifs.com
// @license      MIT
// @grant        none
// @downloadURL  https://update.sleazyfork.org/scripts/444631/Redgifs%20media%20controls.user.js
// @updateURL    https://update.sleazyfork.org/scripts/444631/Redgifs%20media%20controls.meta.js
// ==/UserScript==

/* jshint esversion: 6 */

(function() {
    "use strict";
    console.info("Redgifs media controls initiated");

    const SELECTORS = {
        MUTE_BUTTON: ".sound",
        QUALITY_BUTTON: ".gif-quality",
        PLAY_BUTTON: "video",
        SEARCH_BOX_ID: "global-search-input",
        PLAYER: ".Player"
    };

    let videoElement = null;
    let isPseudoFullscreen = false;
    let pseudoStyle = null;
    let fsContainer = null;
    let originalParent = null; // Store original parent
    let originalNextSibling = null; // Store position in DOM
    let lastToggle = 0; // Throttle timestamp
    let observer = null;

    function getPlayerInSight() {
        const element = document.querySelector(SELECTORS.PLAYER + ':has(video.isloaded)') ||
                        Array.prototype.filter.call(document.querySelectorAll(SELECTORS.PLAYER), isInViewport)[0];
        console.log("Element in sight:", element);
        return element || videoElement;
    }

    function videoPlayerRefresher() {
        const newElement = getPlayerInSight();
        if (newElement && newElement !== videoElement) {
            console.log("Updated videoElement:", newElement);
            videoElement = newElement;
        }
    }

    function isMuted() {
        return (videoElement?.querySelector(`${SELECTORS.MUTE_BUTTON} > div[class=label]`)?.innerText === "Off");
    }

    function toggleSound(forceSoundState = false) {
        if (forceSoundState && !isMuted()) return;
        videoElement?.querySelector(SELECTORS.MUTE_BUTTON)?.click();
    }

    function togglePseudoFullscreen() {
        const now = Date.now();
        if (now - lastToggle < 500) {
            console.warn("Throttling pseudo-fullscreen toggle");
            return;
        }
        lastToggle = now;

        videoPlayerRefresher();
        if (!videoElement) {
            console.warn("No video element found for fullscreen");
            return;
        }

        console.log("Toggling pseudo-fullscreen, videoElement:", videoElement);
        if (isPseudoFullscreen) {
            // EXIT FULLSCREEN
            if (pseudoStyle) pseudoStyle.remove();
            if (fsContainer) {
                // Restore to original position
                if (originalParent && originalParent.isConnected) {
                    if (originalNextSibling && originalNextSibling.parentNode) {
                        originalParent.insertBefore(videoElement, originalNextSibling);
                    } else {
                        originalParent.appendChild(videoElement);
                    }
                } else {
                    // Fallback if original parent is gone
                    const fallbackParent = document.querySelector('.previewFeed') || document.body;
                    fallbackParent.appendChild(videoElement);
                }
                fsContainer.remove();
                fsContainer = null;
            }
            document.body.style.overflow = '';
            isPseudoFullscreen = false;
            originalParent = null;
            originalNextSibling = null;
            console.log("Exited pseudo-fullscreen");
            
            // Force a small delay to ensure DOM has settled
            setTimeout(() => {
                const video = videoElement?.querySelector('video');
                if (video) {
                    video.style.visibility = 'visible';
                    video.style.opacity = '1';
                }
            }, 50);
        } else {
            // ENTER FULLSCREEN
            // Store original parent and position BEFORE moving
            originalParent = videoElement.parentNode;
            originalNextSibling = videoElement.nextSibling;
            console.log("Stored original parent:", originalParent, "next sibling:", originalNextSibling);
            
            isPseudoFullscreen = true;
            fsContainer = document.createElement('div');
            fsContainer.id = 'redgifs-fs-container';
            fsContainer.appendChild(videoElement); // Move player to new container
            document.body.appendChild(fsContainer);
            console.log("Moved player to fullscreen container");

            const video = videoElement.querySelector('video');
            if (video && video.paused) video.play().catch(err => console.warn("Play failed:", err)); // Attempt to resume

            pseudoStyle = document.createElement('style');
            pseudoStyle.id = 'redgifs-pseudo-fs';
            pseudoStyle.innerHTML = `
                body { overflow: hidden !important; margin: 0 !important; background: #000 !important; }
                #redgifs-fs-container {
                    position: fixed !important; inset: 0 !important; margin: 0 !important; overflow: hidden !important;
                    z-index: 100000 !important; height: 100vh !important; width: 100vw !important;
                    background: #000 !important;
                }
                #redgifs-fs-container ${SELECTORS.PLAYER} {
                    position: relative !important; height: 100% !important; width: 100% !important;
                }
                #redgifs-fs-container ${SELECTORS.PLAYER} video {
                    height: 100% !important; width: 100% !important; object-fit: contain !important;
                    position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;
                    z-index: 100001 !important; visibility: visible !important; opacity: 1 !important;
                }
                .topNav, .ApplicationFooter, .Player-MetaInfo { display: none !important; }
            `;
            document.head.appendChild(pseudoStyle);
            document.body.style.overflow = 'hidden';
            console.log("Entered pseudo-fullscreen, style applied");
        }
    }

    function getQuality() {
        return videoElement?.querySelector(SELECTORS.QUALITY_BUTTON)?.classList[1];
    }

    function toggleQuality(forceHDState = false) {
        const qualityButton = videoElement?.querySelector(SELECTORS.QUALITY_BUTTON);
        if (forceHDState && qualityButton?.classList.contains("hd")) return;
        qualityButton?.click();
    }

    function togglePlayState(forcePlayState) {
        const playerElement = videoElement?.querySelector(SELECTORS.PLAY_BUTTON);
        if (!playerElement) return;
        if (forcePlayState === true) playerElement.play();
        else if (forcePlayState === false) playerElement.pause();
        else playerElement.click();
    }

    function seekVideo(time, isMarker = false, absolute = false) {
        const video = videoElement?.querySelector("video");
        if (!video) return;
        if (absolute) video.currentTime = Number(time);
        else if (!isMarker) video.currentTime = Math.max(0, video.currentTime + Number(time));
        else video.currentTime = (time * video.duration) / 10;
    }

    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return rect.y > 0 && rect.y < (window.innerHeight / 2);
    }

    function syncPlayerSettings(exportMode = false) {
        videoPlayerRefresher();
        if (!videoElement) return;

        const playerQuality = getQuality();
        const playerAudible = !isMuted();

        if (exportMode) {
            localStorage.setItem("quality", playerQuality);
            localStorage.setItem("audible", playerAudible);
        }

        const syncedQuality = localStorage.getItem("quality") || playerQuality;
        const syncedAudible = (localStorage.getItem("audible") || String(playerAudible)) === "true";
        if (syncedQuality !== playerQuality) toggleQuality();
        if (syncedAudible !== playerAudible) toggleSound();
    }

    document.addEventListener("keydown", e => {
        console.log("Key pressed:", e.code, "Target:", e.target);
        if (e.target.id === SELECTORS.SEARCH_BOX_ID) return;
        videoPlayerRefresher();
        switch(e.code) {
            case "KeyF":
                e.preventDefault();
                togglePseudoFullscreen();
                break;
            case "KeyM":
                toggleSound();
                break;
            case "KeyQ":
                toggleQuality();
                break;
            case "Space":
                e.preventDefault();
                e.stopImmediatePropagation();
                togglePlayState();
                break;
            case "KeyA":
                togglePseudoFullscreen();
                toggleSound(true);
                toggleQuality(true);
                break;
            case "ArrowLeft":
                seekVideo(-5);
                break;
            case "ArrowRight":
                seekVideo(5);
                break;
            case "ArrowUp":
            case "ArrowDown":
                if (isPseudoFullscreen) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                break;
            case "Digit0": case "Digit1": case "Digit2": case "Digit3": case "Digit4":
            case "Digit5": case "Digit6": case "Digit7": case "Digit8": case "Digit9":
                seekVideo(Number(e.code[5]), true);
                break;
            default: console.log("Unregistered key:", e.code);
        }
    });

    observer = new MutationObserver(() => {
        videoPlayerRefresher();
        syncPlayerSettings();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    let lastKnownScrollPosition = 0;
    let ticking = false;
    document.addEventListener('scroll', function(e) {
        lastKnownScrollPosition = window.scrollY;
        if (!ticking) {
            window.requestAnimationFrame(function() {
                videoPlayerRefresher();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener("blur", () => syncPlayerSettings(true), false);
    window.addEventListener("focus", () => setTimeout(syncPlayerSettings, 100), false);
    window.addEventListener("load", () => syncPlayerSettings());
})();
