// Subscription page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize subscription page functionality
    initSubscriptionPage();
});

function initSubscriptionPage() {
    // Add click event listeners to plan cards
    const planCards = document.querySelectorAll('.plan-card');
    
    planCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (!e.target.classList.contains('btn')) {
                const chooseBtn = this.querySelector('.choose-btn');
                if (chooseBtn) {
                    chooseBtn.click();
                }
            }
        });
    });

    // Add animation to plan cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe plan cards for animation
    planCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Free trial button functionality
    const trialButtons = document.querySelectorAll('.trial-btn');
    trialButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const planName = this.closest('.plan-card').querySelector('.plan-name').textContent;
            showTrialModal(planName);
        });
    });

    // History button functionality
    const historyBtn = document.querySelector('.history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', function() {
            alert('Viewing history feature coming soon!');
        });
    }
}

function showTrialModal(planName) {
    // Create modal for free trial
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: rgba(26, 31, 38, 0.95);
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            border: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <h2 style="margin-bottom: 20px; color: #fff;">Start Your Free Trial</h2>
            <p style="margin-bottom: 30px; color: #a0a0a0; line-height: 1.6;">
                You've selected the <strong>${planName}</strong>. Enjoy 7 days free trial before your subscription begins.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirmTrial" style="
                    padding: 12px 30px;
                    background: #b30000;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Start Free Trial</button>
                <button id="cancelTrial" style="
                    padding: 12px 30px;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners to modal buttons
    modal.querySelector('#confirmTrial').addEventListener('click', function() {
        alert(`Free trial started for ${planName}! Redirecting to payment...`);
        modal.remove();
        // In a real application, you would redirect to payment page
        // window.location.href = 'payment.html';
    });
    
    modal.querySelector('#cancelTrial').addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Enhanced plan selection with localStorage
function selectPlan(planName, price) {
    localStorage.setItem('selectedPlan', JSON.stringify({
        name: planName,
        price: price,
        selectedAt: new Date().toISOString()
    }));
    
    // You can add additional logic here for analytics or other tracking
    console.log(`Plan selected: ${planName} at ${price}`);
}