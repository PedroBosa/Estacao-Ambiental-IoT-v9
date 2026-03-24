document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const tocNav = document.getElementById('toc');
    const loading = document.getElementById('loading');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    // Toggle Mobile Sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        if(overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            setTimeout(() => { overlay.style.display = 'none'; }, 200);
        } else {
            overlay.style.display = 'block';
            setTimeout(() => { overlay.classList.add('active'); }, 10);
        }
    }

    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Setup Marked.js Config
    const renderer = new marked.Renderer();
    
    // Custom heading renderer to extract ids for ToC
    const tocList = [];
    renderer.heading = function(text, level, raw) {
        // Create an id from the plain text (strip out HTML / Markdown tags)
        const strippedText = raw.replace(/<[^>]+>/g, '').trim();
        const id = 'h-' + strippedText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
        
        if (level === 2 || level === 3) {
            tocList.push({ id, text: strippedText, level });
        }
        
        return `<h${level} id="${id}">${text}</h${level}>`;
    };

    // Custom blockquote renderer for Alerts
    renderer.blockquote = function(quote) {
        let className = "markdown-quote";
        if (quote.includes('🔴') || quote.includes('CRÍTICO')) {
            className = "alert-critical";
        } else if (quote.includes('⚠️') || quote.includes('IMPORTANTE') || quote.includes('MÁ PRÁTICA') || quote.includes('Atenção')) {
            className = "alert-warning";
        }
        return `<blockquote class="${className}">${quote}</blockquote>`;
    };

    marked.setOptions({
        renderer: renderer,
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-',
        gfm: true,
        breaks: true
    });

    // Fetch and render the Markdown file
    async function loadMarkdown() {
        try {
            // Using ../Estação.md relative to the viewer folder
            const response = await fetch('../Estação.md');
            if (!response.ok) throw new Error('Falha ao carregar o arquivo Estação.md (Status: ' + response.status + ')');
            
            const text = await response.text();
            
            // Parse content
            const html = marked.parse(text);
            contentDiv.innerHTML = html;
            
            // Build Table of Contents
            buildToC();
            
            // Setup smooth scrolling for links
            setupSmoothScroll();
            
            // Setup intersection observer for active ToC links
            setupScrollSpy();
            
            // Hide loading, show content
            loading.style.display = 'none';
            contentDiv.classList.add('loaded');
            
        } catch (error) {
            console.error('Error loading markdown:', error);
            contentDiv.innerHTML = `
                <div style="text-align:center; padding: 40px;">
                    <h2 style="color: #EF4444; margin-bottom: 20px;">Erro ao carregar o documento</h2>
                    <p style="color: var(--text-secondary)">
                        Para o carregamento funcionar via fetch() local, este visualizador precisa rodar em um servidor local (extensão Live Server do VSCode, python -m http.server, etc) devido às políticas de CORS do navegador em arquivos locais <code>file://</code>.
                    </p>
                    <p style="margin-top:20px; padding:15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <strong>Log: </strong> ${error.message}
                    </p>
                </div>`;
            loading.style.display = 'none';
            contentDiv.classList.add('loaded');
        }
    }

    function buildToC() {
        if (tocList.length === 0) return;
        
        const ul = document.createElement('ul');
        tocList.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${item.id}`;
            a.textContent = item.text;
            a.className = `toc-h${item.level}`;
            a.dataset.targetId = item.id;
            
            // Close sidebar on mobile when clicking a link
            a.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    toggleSidebar();
                }
            });
            
            li.appendChild(a);
            ul.appendChild(li);
        });
        
        tocNav.appendChild(ul);
    }

    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 30, // Offset for breathing room
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    function setupScrollSpy() {
        const sections = document.querySelectorAll('#content h2, #content h3');
        const navLinks = document.querySelectorAll('#toc a');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Remove active from all
                    navLinks.forEach(link => link.classList.remove('active'));
                    // Add active to current
                    const activeLink = document.querySelector(`#toc a[data-target-id="${entry.target.id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                        // Scroll ToC slightly if needed (optional)
                    }
                }
            });
        }, { rootMargin: '-10% 0px -80% 0px' }); 

        sections.forEach(section => observer.observe(section));
    }

    // Init
    loadMarkdown();
});
