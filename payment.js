// JavaScript để chuyển đổi lựa chọn phương thức thanh toán
document.addEventListener('DOMContentLoaded', function() {
    const cardOption = document.getElementById('card-option');
    const walletOption = document.getElementById('wallet-option');
    
    cardOption.addEventListener('click', function() {
        cardOption.classList.add('selected');
        walletOption.classList.remove('selected');
    });
    
    walletOption.addEventListener('click', function() {
        walletOption.classList.add('selected');
        cardOption.classList.remove('selected');
    });
});