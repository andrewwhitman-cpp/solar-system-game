// Menu & instructions overlay
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menuButton');
    const instructionsOverlay = document.getElementById('instructionsOverlay');
    const closeBtn = document.getElementById('closeInstructions');

    function openInstructions() {
        instructionsOverlay.style.display = 'flex';
        instructionsOverlay.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
    }

    function closeInstructions() {
        instructionsOverlay.style.display = 'none';
        instructionsOverlay.setAttribute('aria-hidden', 'true');
        menuButton.focus();
    }

    menuButton.addEventListener('click', openInstructions);

    closeBtn.addEventListener('click', closeInstructions);

    instructionsOverlay.addEventListener('click', (e) => {
        if (e.target === instructionsOverlay) {
            closeInstructions();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && instructionsOverlay.style.display === 'flex') {
            e.preventDefault();
            closeInstructions();
        }
    });
});
