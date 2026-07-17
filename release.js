(function () {
    const owner = "ArnieTW";
    const repo = "NyankoBot";
    const allReleasesUrl = `https://github.com/${owner}/${repo}/releases`;
    const releasesApiUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`;
    const fallbackUrl = allReleasesUrl;

    const selectors = {
        title: "[data-release-title]",
        meta: "[data-release-meta]",
        changelog: "[data-release-changelog]",
        download: "[data-release-download]",
        options: "[data-release-options]",
        release: "[data-release-link]",
        status: "[data-release-status]"
    };

    const preferredAssetPattern = /\.(zip|msi|exe|7z|tar\.gz)$/i;
    const runtimeReleasePattern = /^runtimes/i;
    const packageKinds = [
        {
            key: "windows",
            title: "Windows x64",
            kicker: "Recommended",
            description: "Tray-enabled Windows build. Use this for normal desktop streaming setups.",
            pattern: /^NyankoBot-win-x64-.+\.(zip|msi|exe)$/i
        },
        {
            key: "linux",
            title: "Linux x64",
            kicker: "Testing",
            description: "Linux desktop build with the local setup UI. This build is prepared for testing.",
            pattern: /^NyankoBot-linux-(?!headless).+\.(tar\.gz|zip)$/i
        },
        {
            key: "linux-headless",
            title: "Linux x64 Headless",
            kicker: "Server",
            description: "Linux build without a local tray UI. Manage it from the web setup page.",
            pattern: /^NyankoBot-linux-headless-.+\.(tar\.gz|zip)$/i
        }
    ];

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function linkify(value) {
        return value.replace(
            /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
            '<a href="$2">$1</a>'
        );
    }

    function inlineMarkdown(value) {
        return linkify(escapeHtml(value))
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    }

    function markdownToHtml(markdown) {
        const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
        const blocks = [];
        let paragraph = [];
        let list = [];

        function flushParagraph() {
            if (!paragraph.length) {
                return;
            }

            blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
            paragraph = [];
        }

        function flushList() {
            if (!list.length) {
                return;
            }

            blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
            list = [];
        }

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) {
                flushParagraph();
                flushList();
                continue;
            }

            const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
            if (heading) {
                flushParagraph();
                flushList();
                const level = Math.min(heading[1].length + 2, 4);
                blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
                continue;
            }

            const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
            if (bullet) {
                flushParagraph();
                list.push(bullet[1]);
                continue;
            }

            flushList();
            paragraph.push(trimmed);
        }

        flushParagraph();
        flushList();

        return blocks.join("");
    }

    function setText(selector, text) {
        document.querySelectorAll(selector).forEach((node) => {
            node.textContent = text;
        });
    }

    function setHtml(selector, html) {
        document.querySelectorAll(selector).forEach((node) => {
            node.innerHTML = html;
        });
    }

    function setHref(selector, href) {
        document.querySelectorAll(selector).forEach((node) => {
            node.href = href;
        });
    }

    function formatBytes(bytes) {
        const value = Number(bytes || 0);
        if (!Number.isFinite(value) || value <= 0) {
            return "";
        }

        const units = ["B", "KB", "MB", "GB"];
        let size = value;
        let index = 0;
        while (size >= 1024 && index < units.length - 1) {
            size /= 1024;
            index += 1;
        }

        return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
    }

    function pickDownloadUrl(release) {
        const assets = Array.isArray(release.assets) ? release.assets : [];
        const preferredAsset = assets.find((asset) => preferredAssetPattern.test(asset.name || ""));
        const firstAsset = assets[0];
        return preferredAsset?.browser_download_url || firstAsset?.browser_download_url || release.html_url || fallbackUrl;
    }

    function findAsset(release, pattern) {
        const assets = Array.isArray(release.assets) ? release.assets : [];
        return assets.find((asset) => pattern.test(asset.name || ""));
    }

    function isRuntimeRelease(release) {
        return runtimeReleasePattern.test(release?.tag_name || "") || runtimeReleasePattern.test(release?.name || "");
    }

    function selectAppRelease(releases) {
        return (Array.isArray(releases) ? releases : []).find((release) => !isRuntimeRelease(release));
    }

    function findChecksumAsset(release) {
        return findAsset(release, /^SHA256SUMS\.txt$/i) || findAsset(release, /^SHA256SUMS-.+\.txt$/i);
    }

    function renderDownloadOptions(release) {
        const containers = document.querySelectorAll(selectors.options);
        if (!containers.length) {
            return;
        }

        const checksum = findChecksumAsset(release);
        const cards = packageKinds.map((kind) => {
            const asset = findAsset(release, kind.pattern);
            const size = asset ? formatBytes(asset.size) : "";
            const href = asset?.browser_download_url || release.html_url || fallbackUrl;
            const disabledClass = asset ? "" : " disabled";
            const buttonText = asset ? "Download" : "Open GitHub";
            const meta = asset
                ? `${escapeHtml(asset.name)}${size ? ` · ${escapeHtml(size)}` : ""}`
                : "No matching asset was found on the latest release.";

            return `
                <article class="panel download-card${disabledClass}">
                    <div class="download-card-header">
                        <p class="kicker">${escapeHtml(kind.kicker)}</p>
                        <h2>${escapeHtml(kind.title)}</h2>
                    </div>
                    <p>${escapeHtml(kind.description)}</p>
                    <p class="meta">${meta}</p>
                    <a class="button primary" href="${escapeHtml(href)}">${buttonText}</a>
                </article>
            `;
        });

        const checksumHtml = checksum
            ? `<a class="button" href="${escapeHtml(checksum.browser_download_url)}">Download checksums</a>`
            : `<a class="button" href="${escapeHtml(release.html_url || allReleasesUrl)}">View checksums</a>`;

        containers.forEach((container) => {
            container.innerHTML = `${cards.join("")}
                <article class="panel download-card checksum-card">
                    <div>
                        <p class="kicker">Verify</p>
                        <h2>Checksums</h2>
                        <p class="meta">Use SHA256 checksums to verify the downloaded zip before extracting it.</p>
                    </div>
                    ${checksumHtml}
                </article>`;
        });
    }

    function formatDate(value) {
        if (!value) {
            return "";
        }

        return new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(new Date(value));
    }

    function applyRelease(release) {
        const title = release.name || release.tag_name || "Latest Release";
        const publishedDate = formatDate(release.published_at);
        const assetCount = Array.isArray(release.assets) ? release.assets.length : 0;
        const metaParts = [release.tag_name, publishedDate, assetCount ? `${assetCount} download asset${assetCount === 1 ? "" : "s"}` : ""]
            .filter(Boolean);
        const downloadUrl = pickDownloadUrl(release);
        const releaseUrl = release.html_url || allReleasesUrl;

        setText(selectors.title, title);
        setText(selectors.meta, metaParts.join(" · "));
        setHtml(selectors.changelog, release.body ? markdownToHtml(release.body) : "<p>No changelog was published for this release.</p>");
        setHref(selectors.download, downloadUrl);
        setHref(selectors.release, releaseUrl);
        setText(selectors.status, "Loaded from GitHub Releases.");
        renderDownloadOptions(release);
    }

    function applyFallback() {
        setText(selectors.title, "Latest Release");
        setText(selectors.meta, "Open GitHub Releases for the current build.");
        setHtml(selectors.changelog, "<p>The latest release notes could not be loaded. Open GitHub Releases to view downloads and the changelog.</p>");
        setHref(selectors.download, fallbackUrl);
        setHref(selectors.release, allReleasesUrl);
        setText(selectors.status, "GitHub release details are unavailable right now.");
        document.querySelectorAll(selectors.options).forEach((container) => {
            container.innerHTML = `
                <article class="panel download-card">
                    <p class="kicker">Unavailable</p>
                    <h2>Downloads could not be loaded</h2>
                    <p class="meta">Open GitHub Releases to choose a Windows or Linux package.</p>
                    <a class="button primary" href="${fallbackUrl}">Open GitHub Releases</a>
                </article>`;
        });
    }

    async function loadRelease() {
        try {
            const response = await fetch(releasesApiUrl, {
                headers: {
                    Accept: "application/vnd.github+json"
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub returned ${response.status}`);
            }

            const release = selectAppRelease(await response.json());
            if (!release) {
                throw new Error("No app release was found.");
            }

            applyRelease(release);
        } catch (error) {
            applyFallback();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadRelease);
    } else {
        loadRelease();
    }
})();
