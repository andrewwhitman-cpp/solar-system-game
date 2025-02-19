// Menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menuButton');
    const instructionsOverlay = document.getElementById('instructionsOverlay');
    const closeInstructions = document.getElementById('closeInstructions');

    // Show instructions overlay when menu button is clicked
    menuButton.addEventListener('click', () => {
        instructionsOverlay.style.display = 'flex';
    });

    // Hide instructions overlay when close button is clicked
    closeInstructions.addEventListener('click', () => {
        instructionsOverlay.style.display = 'none';
    });

    // Hide instructions overlay when clicking outside the content
    instructionsOverlay.addEventListener('click', (e) => {
        if (e.target === instructionsOverlay) {
            instructionsOverlay.style.display = 'none';
        }
    });
});