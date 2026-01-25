// watch-video.js
class WatchVideo {
    constructor() {
        this.isLiked = false;
        this.isDisliked = false;
        this.myComments = [];
        this.API_KEY = '56c1a98ede8d3aa9bc86e4a1ea319297';
        this.BASE_URL = 'https://api.themoviedb.org/3';
        this.movieData = null;
        this.isVideoPlaying = false;
        this.init();
    }
    
    init() {
        this.loadMovieData();
        this.loadInteractionState();
        this.loadMyComments();
        this.bindEvents();
    }
    
    async loadMovieData() {
        const savedMovieData = localStorage.getItem('currentMovie');
        
        if (savedMovieData) {
            try {
                this.movieData = JSON.parse(savedMovieData);
                console.log('Loaded movie:', this.movieData.title); // Debug
                this.updateMovieInfo();
            } catch (error) {
                console.error('Error parsing movie data:', error);
                this.showDefaultMovie();
            }
        } else {
            console.log('No movie data found in localStorage'); // Debug
            this.showDefaultMovie();
        }
    }
    
    async loadVideo() {
        if (!this.movieData) return;
        
        const trailerContainer = document.getElementById('trailerContainer');
        const posterContainer = document.getElementById('posterContainer');
        
        try {
            // Load video data from API
            const videosResponse = await fetch(
                `${this.BASE_URL}/movie/${this.movieData.id}/videos?api_key=${this.API_KEY}`
            );
            const videosData = await videosResponse.json();
            
            if (videosData.results && videosData.results.length > 0) {
                // Tìm video đầu tiên có thể phát được
                const playableVideo = videosData.results.find(video => 
                    video.site === 'YouTube' && video.type === 'Trailer'
                ) || videosData.results[0];
                
                if (playableVideo) {
                    trailerContainer.innerHTML = `
                        <iframe 
                            src="https://www.youtube.com/embed/${playableVideo.key}?autoplay=1&rel=0&controls=1" 
                            allow="autoplay; encrypted-media" 
                            allowfullscreen>
                        </iframe>
                    `;
                    
                    // Ẩn poster và hiển thị video
                    posterContainer.style.display = 'none';
                    trailerContainer.style.display = 'block';
                    
                    // Thêm class để ẩn nút play
                    document.querySelector('.video-player').classList.add('video-playing');
                    
                    this.showNotification(`Đang phát video: ${this.movieData.title}`);
                } else {
                    this.showNoVideoMessage();
                }
            } else {
                this.showNoVideoMessage();
            }
            
        } catch (error) {
            console.error('Lỗi khi load video:', error);
            this.showNoVideoMessage();
        }
    }
    
    showNoVideoMessage() {
        const trailerContainer = document.getElementById('trailerContainer');
        trailerContainer.innerHTML = `
            <div class="no-trailer-message">
                <h3>Không có video</h3>
                <p>Rất tiếc, hiện không có video cho phim này.</p>
            </div>
        `;
    }
    
    updateMovieInfo() {
        if (!this.movieData) return;
        
        // Cập nhật tiêu đề
        document.getElementById('movieTitle').textContent = this.movieData.title;

        
        // Cập nhật IMDb rating
        if (this.movieData.vote_average) {
            const rating = this.movieData.vote_average.toFixed(1);
            document.getElementById('ratingValue').textContent = rating;
        }
        this.updatePosterBackground();
        
        document.title = `MEGAFILM - ${this.movieData.title}`;
    }
    updatePosterBackground() {
        if (!this.movieData) return;
        
        const posterContainer = document.getElementById('posterContainer');
        const posterImage = document.getElementById('posterImage');
        const trailerContainer = document.getElementById('trailerContainer');
        
        if (this.movieData.backdrop_path) {
            // Sử dụng backdrop (ảnh ngang) thay vì poster (ảnh dọc)
            const backdropUrl = `https://image.tmdb.org/t/p/w1280${this.movieData.backdrop_path}`;
            posterImage.src = backdropUrl;
            posterImage.alt = this.movieData.title;
            
            // Hiển thị poster container và ẩn trailer container
            posterContainer.style.display = 'flex';
            trailerContainer.style.display = 'none';
        } else if (this.movieData.poster_path) {
            // Fallback: nếu không có backdrop thì dùng poster
            const posterUrl = `https://image.tmdb.org/t/p/w780${this.movieData.poster_path}`;
            posterImage.src = posterUrl;
            posterImage.alt = this.movieData.title;
            
            // Hiển thị poster container và ẩn trailer container
            posterContainer.style.display = 'flex';
            trailerContainer.style.display = 'none';
        }
    }
    
    loadInteractionState() {
        if (!this.movieData) return;
        
        const movieId = this.movieData.id;
        const savedLikeState = localStorage.getItem(`video_${movieId}_liked`);
        const savedDislikeState = localStorage.getItem(`video_${movieId}_disliked`);
        
        if (savedLikeState === 'true') {
            this.isLiked = true;
            document.getElementById('likeBtn').classList.add('active');
        }
        
        if (savedDislikeState === 'true') {
            this.isDisliked = true;
            document.getElementById('dislikeBtn').classList.add('active');
        }
    }
    
    loadMyComments() {
        if (!this.movieData) return;
        
        const movieId = this.movieData.id;
        const savedComments = localStorage.getItem(`video_${movieId}_comments`);
        
        if (savedComments) {
            this.myComments = JSON.parse(savedComments);
            this.renderMyComments();
        }
    }
    
    bindEvents() {
        const playButton = document.getElementById('playButton');
        const likeBtn = document.getElementById('likeBtn');
        const dislikeBtn = document.getElementById('dislikeBtn');
        const submitCommentBtn = document.getElementById('submitCommentBtn');
        const commentInput = document.getElementById('commentInput');
        
        // Thêm sự kiện cho nút search
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) searchBtn.addEventListener('click', () => this.openSearch());
        
        // Thêm sự kiện cho nút history
        const historyBtn = document.querySelector('.history-btn');
        if (historyBtn) historyBtn.addEventListener('click', () => this.openHistory());
                const serverButtons = document.querySelectorAll('.server-btn');
        serverButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Xóa active khỏi tất cả các nút server
                serverButtons.forEach(b => b.classList.remove('active'));
                // Thêm active vào nút được click
                e.currentTarget.classList.add('active');
                this.showNotification(`Đã chọn ${e.currentTarget.textContent.trim()}`);
            });
        });
        
        // Các sự kiện khác
        if (playButton) playButton.addEventListener('click', () => this.playVideo());
        if (likeBtn) likeBtn.addEventListener('click', () => this.toggleLike());
        if (dislikeBtn) dislikeBtn.addEventListener('click', () => this.toggleDislike());
        if (submitCommentBtn) submitCommentBtn.addEventListener('click', () => this.submitComment());
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.submitComment();
                }
            });
        }
    }
    
    async playVideo() {
        if (!this.movieData) return;
        
        // Load và phát video
        await this.loadVideo();
        this.isVideoPlaying = true;
    }
    
    openSearch() {
        window.location.href = 'search.html';
    }
    
    openHistory() {
        this.showNotification('Opening watch history...');
    }
    
    toggleLike() {
        if (!this.movieData) return;
        
        this.isLiked = !this.isLiked;
        
        document.getElementById('likeBtn').classList.toggle('active', this.isLiked);
        
        if (this.isLiked && this.isDisliked) {
            this.toggleDislike();
        }
        
        this.showNotification(this.isLiked ? 'Đã thích video' : 'Đã bỏ thích video');
        this.saveInteractionState();
    }
    
    toggleDislike() {
        if (!this.movieData) return;
        
        this.isDisliked = !this.isDisliked;
        
        document.getElementById('dislikeBtn').classList.toggle('active', this.isDisliked);
        
        if (this.isDisliked && this.isLiked) {
            this.toggleLike();
        }
        
        this.showNotification(this.isDisliked ? 'Đã không thích video' : 'Đã bỏ không thích video');
        this.saveInteractionState();
    }
    
    saveInteractionState() {
        if (!this.movieData) return;
        
        const movieId = this.movieData.id;
        localStorage.setItem(`video_${movieId}_liked`, this.isLiked.toString());
        localStorage.setItem(`video_${movieId}_disliked`, this.isDisliked.toString());
    }
    
    submitComment() {
        if (!this.movieData) return;
        
        const commentInput = document.getElementById('commentInput');
        const commentText = commentInput.value.trim();
        
        if (!commentText) {
            this.showNotification('Vui lòng nhập bình luận');
            return;
        }
        
        const newComment = {
            id: Date.now(),
            text: commentText,
            date: new Date().toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        this.myComments.unshift(newComment);
        this.renderMyComments();
        this.saveMyComments();
        commentInput.value = '';
        
        this.showNotification('Đã đăng bình luận');
    }
    
    renderMyComments() {
        const commentsList = document.getElementById('myCommentsList');
        
        if (this.myComments.length === 0) {
            commentsList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Chưa có bình luận nào.</p>';
            return;
        }
        
        commentsList.innerHTML = this.myComments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">Bạn</span>
                    <span class="comment-date">${comment.date}</span>
                </div>
                <p class="comment-text">${comment.text}</p>
            </div>
        `).join('');
    }
    
    saveMyComments() {
        if (!this.movieData) return;
        
        const movieId = this.movieData.id;
        localStorage.setItem(`video_${movieId}_comments`, JSON.stringify(this.myComments));
    }
    
    showDefaultMovie() {
        document.getElementById('movieTitle').textContent = 'Không tìm thấy phim';
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: #b30000;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    const watchVideo = new WatchVideo();
});