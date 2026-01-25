// movie-detail.js - Thêm phần Featured Movies
class MovieDetail {
    constructor() {
        this.isWatchlistAdded = false;
        this.isLiked = false;
        this.currentDot = 0;
        this.movieData = null;
        this.similarMovies = [];
        this.featuredMovies = [];
        this.currentMovieIndex = 0;
        this.API_KEY = '56c1a98ede8d3aa9bc86e4a1ea319297';
        this.BASE_URL = 'https://api.themoviedb.org/3';
        this.init();
    }
    
    init() {
        this.loadMovieData();
        this.loadWatchlistState();
        this.bindEvents();
        this.setupNavigation();
    }
    
    async loadMovieData() {
        const savedMovieData = localStorage.getItem('currentMovie');
        
        if (savedMovieData) {
            this.movieData = JSON.parse(savedMovieData);
            await this.loadSimilarMovies();
            this.updateMovieUI();
        } else {
            this.showDefaultMovie();
        }
    }
    

    
    // Thêm hàm updateFeaturedMoviesUI
    updateFeaturedMoviesUI() {
        const featuredMoviesGrid = document.getElementById('featuredMoviesGrid');
        
        if (!this.featuredMovies || this.featuredMovies.length === 0) {
            featuredMoviesGrid.innerHTML = '<p class="featured-movies-placeholder">Không có phim nổi bật</p>';
            return;
        }
        
        const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w300';
        
        featuredMoviesGrid.innerHTML = this.featuredMovies.map(movie => `
            <div class="featured-movie-card" data-movie-id="${movie.id}">
                <img src="${movie.poster_path ? POSTER_BASE_URL + movie.poster_path : 'https://via.placeholder.com/200x300/333/fff?text=No+Image'}" 
                     alt="${movie.title}" 
                     class="featured-movie-poster"
                     onerror="this.src='https://via.placeholder.com/200x300/333/fff?text=No+Image'">
                <div class="featured-movie-info">
                    <h3 class="featured-movie-title">${movie.title}</h3>
                    <div class="featured-movie-meta">
                        <span class="featured-movie-year">${movie.release_date ? movie.release_date.substring(0,4) : 'N/A'}</span>
                        <span class="featured-movie-rating">⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Thêm sự kiện click cho các thẻ phim
        this.bindFeaturedMoviesEvents();
    }
    
    // Thêm hàm bindFeaturedMoviesEvents
    bindFeaturedMoviesEvents() {
        const movieCards = document.querySelectorAll('.featured-movie-card');
        
        movieCards.forEach(card => {
            card.addEventListener('click', async () => {
                const movieId = card.getAttribute('data-movie-id');
                await this.loadMovieById(movieId);
                
                // Cuộn lên đầu trang để xem thông tin phim mới
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
    
    // Thêm hàm loadMovieById
    async loadMovieById(movieId) {
        try {
            const movieResponse = await fetch(
                `${this.BASE_URL}/movie/${movieId}?api_key=${this.API_KEY}&language=vi-VN`
            );
            const movie = await movieResponse.json();
            
            const creditsResponse = await fetch(
                `${this.BASE_URL}/movie/${movieId}/credits?api_key=${this.API_KEY}`
            );
            const credits = await creditsResponse.json();
            
            const videosResponse = await fetch(
                `${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`
            );
            const videosData = await videosResponse.json();
            
            this.movieData = {
                id: movie.id,
                title: movie.title,
                original_title: movie.original_title,
                overview: movie.overview,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                release_date: movie.release_date,
                runtime: movie.runtime,
                vote_average: movie.vote_average,
                vote_count: movie.vote_count,
                genres: movie.genres,
                cast: credits.cast.slice(0, 6),
                videos: videosData.results
            };
            localStorage.setItem('currentMovie', JSON.stringify(this.movieData));
            
            // Reset trạng thái
            this.isWatchlistAdded = false;
            this.isLiked = false;
            
            // Cập nhật UI
            this.loadWatchlistState();
            this.resetLikeButton();
            this.updateMovieUI();
            
            // Load phim tương tự mới
            await this.loadSimilarMovies();
            
            this.showNotification(`Đã chuyển sang: ${movie.title}`);
            
        } catch (error) {
            console.error('Lỗi khi load phim:', error);
            this.showNotification('Có lỗi khi tải thông tin phim');
        }
    }
    
    // Thêm hàm showFeaturedMoviesError
    showFeaturedMoviesError() {
        const featuredMoviesGrid = document.getElementById('featuredMoviesGrid');
        featuredMoviesGrid.innerHTML = '<p class="featured-movies-placeholder">Không thể tải danh sách phim nổi bật</p>';
    }
    
    // Các hàm khác giữ nguyên...
    async loadSimilarMovies() {
        if (!this.movieData) return;
        
        try {
            const response = await fetch(
                `${this.BASE_URL}/movie/${this.movieData.id}/similar?api_key=${this.API_KEY}&language=vi-VN&page=1`
            );
            const data = await response.json();
            this.similarMovies = data.results.slice(0, 4);
            this.updateNavigationDots();
        } catch (error) {
            console.error('Lỗi khi load phim tương tự:', error);
        }
    }
    
    updateMovieUI() {
        if (!this.movieData) return;
        
        const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
        const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
        
        // Cập nhật background image
        const backgroundImage = document.getElementById('backgroundImage');
        if (this.movieData.backdrop_path) {
            backgroundImage.src = BACKDROP_BASE_URL + this.movieData.backdrop_path;
        } else if (this.movieData.poster_path) {
            backgroundImage.src = BACKDROP_BASE_URL + this.movieData.poster_path;
        }
        backgroundImage.alt = this.movieData.title;
        
        // Cập nhật tiêu đề
        document.getElementById('movieTitle').textContent = this.movieData.title;
        
        // Cập nhật metadata
        document.getElementById('releaseYear').textContent = 
            this.movieData.release_date ? this.movieData.release_date.substring(0,4) : 'N/A';
        
        document.getElementById('runtime').textContent = 
            this.movieData.runtime ? `${this.movieData.runtime} phút` : 'N/A';
        
        document.getElementById('genres').textContent = 
            this.movieData.genres ? this.movieData.genres.map(genre => genre.name).join(' • ') : 'N/A';
        
        document.getElementById('rating').textContent = 
            this.movieData.vote_average ? `⭐ ${this.movieData.vote_average.toFixed(1)}/10` : 'N/A';
        
        // Cập nhật mô tả
        document.getElementById('overview').textContent = 
            this.movieData.overview || 'Chưa có mô tả cho phim này.';
        
        // Cập nhật cast
        this.updateCastUI();
        
        // Cập nhật title trang
        document.title = `MEGAFILM - ${this.movieData.title}`;
    }
    
    updateCastUI() {
        const castGrid = document.getElementById('castGrid');
        
        if (!this.movieData.cast || this.movieData.cast.length === 0) {
            castGrid.innerHTML = '<p style="color: #cccccc; text-align: center; width: 100%;">Không có thông tin diễn viên</p>';
            return;
        }
        
        const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w200';
        
        castGrid.innerHTML = this.movieData.cast.map(actor => `
            <div class="cast-card">
                <img src="${actor.profile_path ? POSTER_BASE_URL + actor.profile_path : 'https://via.placeholder.com/70x70/333/fff?text=No+Image'}" 
                     alt="${actor.name}" 
                     class="cast-photo"
                     onerror="this.src='https://via.placeholder.com/70x70/333/fff?text=No+Image'">
                <div class="cast-info">
                    <h3 class="cast-name">${actor.name}</h3>
                    <p class="cast-character">${actor.character || 'N/A'}</p>
                </div>
            </div>
        `).join('');
    }
    
    updateNavigationDots() {
        const dotsContainer = document.getElementById('navDots');
        const totalMovies = this.similarMovies.length + 1;
        
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < totalMovies; i++) {
            const dot = document.createElement('button');
            dot.className = `nav-dot ${i === this.currentMovieIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToMovie(i));
            dotsContainer.appendChild(dot);
        }
    }
    
    async navigate(direction) {
        const totalMovies = this.similarMovies.length + 1;
        this.currentMovieIndex = (this.currentMovieIndex + direction + totalMovies) % totalMovies;
        
        if (this.currentMovieIndex === 0) {
            await this.loadCurrentMovie();
        } else {
            const similarMovieIndex = this.currentMovieIndex - 1;
            await this.loadSimilarMovie(this.similarMovies[similarMovieIndex].id);
        }
        
        this.updateNavigationDots();
    }
    
    async goToMovie(index) {
        this.currentMovieIndex = index;
        
        if (index === 0) {
            await this.loadCurrentMovie();
        } else {
            const similarMovieIndex = index - 1;
            await this.loadSimilarMovie(this.similarMovies[similarMovieIndex].id);
        }
        
        this.updateNavigationDots();
    }
    
    async loadCurrentMovie() {
        this.updateMovieUI();
        this.showNotification(`Đang xem: ${this.movieData.title}`);
    }
    
    async loadSimilarMovie(movieId) {
        try {
            const movieResponse = await fetch(
                `${this.BASE_URL}/movie/${movieId}?api_key=${this.API_KEY}&language=vi-VN`
            );
            const movie = await movieResponse.json();
            
            const creditsResponse = await fetch(
                `${this.BASE_URL}/movie/${movieId}/credits?api_key=${this.API_KEY}`
            );
            const credits = await creditsResponse.json();
            
            const videosResponse = await fetch(
                `${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`
            );
            const videosData = await videosResponse.json();
            
            this.movieData = {
                id: movie.id,
                title: movie.title,
                original_title: movie.original_title,
                overview: movie.overview,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                release_date: movie.release_date,
                runtime: movie.runtime,
                vote_average: movie.vote_average,
                vote_count: movie.vote_count,
                genres: movie.genres,
                cast: credits.cast.slice(0, 6),
                videos: videosData.results
            };
            localStorage.setItem('currentMovie', JSON.stringify(this.movieData));
            
            this.isWatchlistAdded = false;
            this.isLiked = false;
            
            this.loadWatchlistState();
            this.resetLikeButton();
            this.updateMovieUI();
            
            this.showNotification(`Đã chuyển sang: ${movie.title}`);
            
        } catch (error) {
            console.error('Lỗi khi load phim tương tự:', error);
            this.showNotification('Có lỗi khi chuyển phim');
        }
    }
    
    resetLikeButton() {
        const likeBtn = document.getElementById('likeBtn');
        if (likeBtn) {
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '<span class="thumbs-up-icon">👍</span> Like';
        }
    }
    
    setupNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigate(-1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigate(1));
        }
    }
    
    bindEvents() {
        const watchNowBtn = document.getElementById('watchNowBtn');
        const watchlistBtn = document.getElementById('watchlistBtn');
        const likeBtn = document.getElementById('likeBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const shareBtn = document.getElementById('shareBtn');
        const trailerBtn = document.getElementById('trailerBtn');
        const closeTrailer = document.getElementById('closeTrailer');
        const trailerModal = document.getElementById('trailerModal');
        
        // Thêm sự kiện cho nút search
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) searchBtn.addEventListener('click', () => this.openSearch());
        
        // Giữ sự kiện cho nút history (nếu có)
        const historyBtn = document.querySelector('.history-btn');
        if (historyBtn) historyBtn.addEventListener('click', () => this.openHistory());
        
        // Các sự kiện khác giữ nguyên...
        if (watchNowBtn) watchNowBtn.addEventListener('click', () => this.watchNow());
        if (watchlistBtn) watchlistBtn.addEventListener('click', () => this.toggleWatchlist());
        if (likeBtn) likeBtn.addEventListener('click', () => this.toggleLike());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadMovie());
        if (shareBtn) shareBtn.addEventListener('click', () => this.shareMovie());
        if (trailerBtn) trailerBtn.addEventListener('click', () => this.showTrailer());
        if (closeTrailer) closeTrailer.addEventListener('click', () => this.closeTrailer());
        if (trailerModal) {
            trailerModal.addEventListener('click', (e) => {
                if (e.target === trailerModal) this.closeTrailer();
            });
        }
    }

    // Thêm hàm xử lý search
    openSearch() {
        // Chuyển đến trang search hoặc mở modal search
        window.location.href = 'search.html';
        // Hoặc: this.showSearchModal();
    }

    // Hàm xử lý history (nếu cần)
    openHistory() {
        // Chuyển đến trang history hoặc mở modal history
        this.showNotification('Opening watch history...');
        // window.location.href = 'history.html';
    }
    
    watchNow() {
            if (this.movieData) {
        localStorage.setItem('currentMovie', JSON.stringify(this.movieData));
        
        // Thêm delay nhỏ để đảm bảo localStorage được cập nhật
        setTimeout(() => {
            window.location.href = 'watch-video.html';
        }, 100);
    } else {
        window.location.href = 'watch-video.html';
    }
    }
    
    toggleWatchlist() {
        const watchlistBtn = document.getElementById('watchlistBtn');
        this.isWatchlistAdded = !this.isWatchlistAdded;
        
        if (this.isWatchlistAdded) {
            watchlistBtn.innerHTML = '<span class="btn-icon">✓</span> Added to Watchlist';
            watchlistBtn.classList.add('added');
            this.saveWatchlistState(true);
            this.showNotification('Added to Watchlist!');
        } else {
            watchlistBtn.innerHTML = '<span class="btn-icon">+</span> Add Watchlist';
            watchlistBtn.classList.remove('added');
            this.saveWatchlistState(false);
            this.showNotification('Removed from Watchlist!');
        }
    }
    
    loadWatchlistState() {
        if (!this.movieData) return;
        
        const movieId = this.movieData.id;
        const savedState = localStorage.getItem(`watchlist_${movieId}`);
        if (savedState === 'true') {
            this.isWatchlistAdded = true;
            const watchlistBtn = document.getElementById('watchlistBtn');
            if (watchlistBtn) {
                watchlistBtn.innerHTML = '<span class="btn-icon">✓</span> Added to Watchlist';
                watchlistBtn.classList.add('added');
            }
        }
    }
    
    saveWatchlistState(state) {
        if (!this.movieData) return;
        
        const movieId = this.movieData.id;
        localStorage.setItem(`watchlist_${movieId}`, state.toString());
    }
    
    toggleLike() {
        const likeBtn = document.getElementById('likeBtn');
        this.isLiked = !this.isLiked;
        
        if (this.isLiked) {
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '<span class="thumbs-up-icon">👍</span> Liked';
            this.showNotification('You liked this movie!');
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '<span class="thumbs-up-icon">👍</span> Like';
            this.showNotification('You unliked this movie!');
        }
    }
    
    downloadMovie() {
        if (!this.movieData) return;
        this.showNotification(`Download started: ${this.movieData.title}`);
    }
    
    shareMovie() {
        if (!this.movieData) return;
        
        if (navigator.share) {
            navigator.share({
                title: this.movieData.title,
                text: `Check out "${this.movieData.title}" on MEGAFILM!`,
                url: window.location.href
            });
        } else {
            this.showNotification(`Share this movie: ${this.movieData.title}\nURL: ${window.location.href}`);
        }
    }
    
    async showTrailer() {
        if (!this.movieData) return;
        
        const trailerModal = document.getElementById('trailerModal');
        const trailerContainer = document.getElementById('trailerContainer');
        
        trailerModal.classList.remove('hidden');
        
        trailerContainer.innerHTML = `
            <div class="trailer-loading">
                <div class="trailer-loading-spinner"></div>
                <p>Đang tải trailer...</p>
            </div>
        `;
        
        try {
            if (this.movieData.videos && this.movieData.videos.length > 0) {
                const trailers = this.movieData.videos.filter(video => 
                    video.site === 'YouTube' && 
                    (video.type === 'Trailer' || video.type === 'Teaser')
                );
                
                if (trailers.length > 0) {
                    const officialTrailer = trailers.find(video => video.official) || trailers[0];
                    
                    trailerContainer.innerHTML = `
                        <iframe 
                            src="https://www.youtube.com/embed/${officialTrailer.key}?autoplay=1&rel=0" 
                            allow="autoplay; encrypted-media" 
                            allowfullscreen>
                        </iframe>
                    `;
                    
                    this.showNotification(`Đang phát trailer: ${this.movieData.title}`);
                } else {
                    trailerContainer.innerHTML = `
                        <div class="no-trailer-message">
                            <h3>Không có trailer</h3>
                            <p>Rất tiếc, hiện không có trailer cho phim này.</p>
                        </div>
                    `;
                }
            } else {
                trailerContainer.innerHTML = `
                    <div class="no-trailer-message">
                        <h3>Không có trailer</h3>
                        <p>Rất tiếc, hiện không có trailer cho phim này.</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Lỗi khi load trailer:', error);
            trailerContainer.innerHTML = `
                <div class="no-trailer-message">
                    <h3>Lỗi khi tải trailer</h3>
                    <p>Không thể tải trailer. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }
    
    closeTrailer() {
        const trailerModal = document.getElementById('trailerModal');
        const trailerContainer = document.getElementById('trailerContainer');
        
        trailerModal.classList.add('hidden');
        trailerContainer.innerHTML = '';
        this.showNotification('Đã đóng trailer');
    }
    
    showDefaultMovie() {
        console.log('Showing default movie data');
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
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
                document.body.removeChild(notification);
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
    const movieDetail = new MovieDetail();
});

// Utility functions
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
