document.addEventListener('DOMContentLoaded', function() {
    // Hiển thị tất cả thông báo sau 2 giây
    setTimeout(function() {
        const successMessage = document.getElementById('successMessage');
        successMessage.style.display = 'block';
    }, 10000);
});