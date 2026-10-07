(function () {
    const guideSearch = document.getElementById("guide-search");
    if (guideSearch) {
        const guideCards = Array.from(document.querySelectorAll("#guide-map > a.card"));
        const searchStatus = document.getElementById("guide-search-status");

        function filterGuides() {
            const query = guideSearch.value.trim().toLocaleLowerCase();
            let visibleCount = 0;

            for (const card of guideCards) {
                const matches = card.textContent.toLocaleLowerCase().includes(query);
                card.hidden = !matches;
                if (matches) visibleCount += 1;
            }

            searchStatus.textContent = query
                ? visibleCount === 0
                    ? "No guides match that search. Try another topic."
                    : `${visibleCount} ${visibleCount === 1 ? "guide" : "guides"} found.`
                : "Browse all guides or search by topic.";
        }

        guideSearch.addEventListener("input", filterGuides);
        filterGuides();
    }

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

