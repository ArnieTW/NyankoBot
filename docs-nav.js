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

    const sidebar = document.querySelector(".tree-nav");
    if (sidebar) {
        const groups = [
            ["Start", [["index.html", "Overview"], ["download-install.html", "Download & Install"], ["quick-setup.html", "Quick Setup"]]],
            ["Setup", [["overlay-setup.html", "Overlay Setup"], ["connectors.html", "Connectors"], ["stream-status.html", "Stream Status"], ["command-triggers.html", "Command Triggers"], ["channel-rewards.html", "Channel Rewards"], ["chat.html", "Chat"], ["streamerbot.html", "Streamer.bot"], ["tts.html", "TTS Setup"], ["translators.html", "Translators"], ["manage-sources.html", "Storage"], ["settings.html", "Settings"]]],
            ["Reference", [["platform-events.html", "Platform Events"], ["actions-reference.html", "Action Reference"], ["connector-actions.html", "Connector Actions"], ["variables.html", "Variables"], ["klipy.html", "KLIPY Media"], ["user-groups.html", "User Groups"]]],
            ["Components", [["component-overlay.html", "Overlay"], ["component-box.html", "Box"], ["component-add-trigger.html", "Binding Editor"], ["component-add-source-dialog.html", "Source Controls"], ["component-if-else-control.html", "IF/Else Control"], ["component-argument-control.html", "Argument Control"]]],
            ["Learn", [["examples.html", "Examples"], ["troubleshooting.html", "Troubleshooting"]]]
        ];
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const article = document.querySelector(".doc-content");
        const currentSections = article
            ? Array.from(article.querySelectorAll(":scope > section[id]"))
                .map((section) => ({ section, heading: section.querySelector("h2") }))
                .filter((entry) => entry.heading)
            : [];
        const nav = document.createElement("nav");
        nav.className = "docs-sidebar";
        nav.setAttribute("aria-label", "Documentation pages");
        let currentLink = null;

        for (const [title, links] of groups) {
            const group = document.createElement("div");
            group.className = "docs-sidebar-group";
            const heading = document.createElement("div");
            heading.className = "docs-sidebar-title";
            heading.textContent = title;
            group.append(heading);

            for (const [href, label] of links) {
                const link = document.createElement("a");
                link.className = "docs-sidebar-link";
                link.href = href;
                link.textContent = label;
                if (href === currentPage) {
                    link.classList.add("current");
                    link.setAttribute("aria-current", "page");
                    currentLink = link;
                }
                group.append(link);

                if (href === currentPage && currentSections.length) {
                    const children = document.createElement("div");
                    children.className = "docs-sidebar-children";
                    for (const { section, heading: sectionHeading } of currentSections) {
                        const anchor = document.createElement("a");
                        anchor.className = "docs-sidebar-anchor";
                        anchor.href = `#${section.id}`;
                        anchor.textContent = sectionHeading.textContent.trim();
                        children.append(anchor);
                    }
                    group.append(children);
                }
            }
            nav.append(group);
        }
        sidebar.replaceChildren(nav);
        if (currentLink) {
            window.requestAnimationFrame(() => {
                const linkTop = currentLink.getBoundingClientRect().top;
                const sidebarTop = sidebar.getBoundingClientRect().top;
                sidebar.scrollTop += Math.max(0, linkTop - sidebarTop - 80);
            });
        }
    }

    const activeOffset = 96;
    const sectionLinks = Array.from(document.querySelectorAll(".docs-sidebar-anchor"))
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

