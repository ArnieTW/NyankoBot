(function () {
    const roadmapMarkdownUrl = "https://raw.githubusercontent.com/wiki/ArnieTW/NyankoBot/Roadmap.md";
    const wikiRoadmapUrl = "https://github.com/ArnieTW/NyankoBot/wiki/Roadmap";
    const contentSelector = "[data-roadmap-content]";
    const statusSelector = "[data-roadmap-status]";

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function inlineMarkdown(value) {
        return escapeHtml(value)
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    }

    function pushParagraph(blocks, paragraph) {
        if (!paragraph.length) {
            return;
        }

        blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
        paragraph.length = 0;
    }

    function pushList(blocks, list) {
        if (!list.length) {
            return;
        }

        blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
        list.length = 0;
    }

    function markdownToHtml(markdown) {
        const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
        const blocks = [];
        const paragraph = [];
        const list = [];

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) {
                pushParagraph(blocks, paragraph);
                pushList(blocks, list);
                return;
            }

            const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
            if (heading) {
                pushParagraph(blocks, paragraph);
                pushList(blocks, list);
                const level = Math.min(heading[1].length + 1, 4);
                blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
                return;
            }

            const bullet = trimmed.match(/^-\s+(.+)$/);
            if (bullet) {
                pushParagraph(blocks, paragraph);
                list.push(bullet[1]);
                return;
            }

            pushList(blocks, list);
            paragraph.push(trimmed);
        });

        pushParagraph(blocks, paragraph);
        pushList(blocks, list);
        return blocks.join("");
    }

    function setHtml(selector, html) {
        document.querySelectorAll(selector).forEach((element) => {
            element.innerHTML = html;
        });
    }

    function setText(selector, text) {
        document.querySelectorAll(selector).forEach((element) => {
            element.textContent = text;
        });
    }

    async function loadRoadmap() {
        try {
            const response = await fetch(roadmapMarkdownUrl, {
                headers: { Accept: "text/markdown,text/plain,*/*" },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(`GitHub returned ${response.status}`);
            }

            const markdown = await response.text();
            setHtml(contentSelector, markdownToHtml(markdown));
            setText(statusSelector, "Loaded from GitHub Wiki.");
        } catch (error) {
            setHtml(contentSelector, `
                <p>The roadmap could not be loaded from GitHub Wiki right now.</p>
                <p><a href="${wikiRoadmapUrl}">Open the roadmap on GitHub Wiki</a>.</p>
            `);
            setText(statusSelector, "GitHub Wiki roadmap is unavailable right now.");
            console.warn("Could not load roadmap", error);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadRoadmap);
    } else {
        loadRoadmap();
    }
})();
