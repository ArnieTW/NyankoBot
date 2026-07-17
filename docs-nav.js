(function () {
    const activeOffset = 96;
    const sectionLinks = Array.from(document.querySelectorAll(".tree-nav a[href^='#']"))
        .map((link) => {
            const id = decodeURIComponent(link.hash.slice(1));
            return {
                link,
                section: document.getElementById(id)
            };
        })
        .filter((entry) => entry.section);

    if (!sectionLinks.length) {
        return;
    }

    let queued = false;

    function updateActiveSection() {
        queued = false;

        let active = sectionLinks[0];
        for (const entry of sectionLinks) {
            if (entry.section.getBoundingClientRect().top <= activeOffset) {
                active = entry;
            } else {
                break;
            }
        }

        for (const entry of sectionLinks) {
            const isActive = entry === active;
            entry.link.classList.toggle("active", isActive);
            if (isActive) {
                entry.link.setAttribute("aria-current", "location");
            } else {
                entry.link.removeAttribute("aria-current");
            }
        }
    }

    function requestUpdate() {
        if (queued) {
            return;
        }

        queued = true;
        window.requestAnimationFrame(updateActiveSection);
    }

    document.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);
    updateActiveSection();
})();

