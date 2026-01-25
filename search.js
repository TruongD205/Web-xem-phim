const API_KEY = '56c1a98ede8d3aa9bc86e4a1ea319297';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = '';
let currentFilters = {};
let isLoading = false;

// Load phim phổ biến và danh sách filter khi trang web mở
document.addEventListener('DOMContentLoaded', function() {
    loadPopularMovies();
    loadFilterOptions();
    setupEventListeners();
});

// Thiết lập event listeners
function setupEventListeners() {
    // Tìm kiếm khi nhấn Enter
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMovies();
        }
    });
} // ĐÃ THÊM DẤU ĐÓNG NGOẶC Ở ĐÂY

// Hàm apply filters
function applyFilters() {
    // Lấy giá trị search input
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    // Nếu có từ khóa tìm kiếm, thực hiện search bình thường
    if (query) {
        searchMovies();
        return;
    }
    
    // Nếu không có từ khóa nhưng có filter, thực hiện discover với filter
    const filters = {
        genre: document.getElementById('genreFilter').value,
        country: document.getElementById('countryFilter').value,
        year: document.getElementById('yearFilter').value,
        rating: document.getElementById('ratingFilter').value,
        sortBy: document.getElementById('sortBy').value
    };
    
    const hasActiveFilters = Object.values(filters).some(value => value !== '');
    
    if (hasActiveFilters) {
        searchMovies();
    } else {
        // Nếu không có filter nào được chọn, hiển thị thông báo
        showNotification('Vui lòng chọn ít nhất một bộ lọc để áp dụng');
    }
}

// Hàm load các tùy chọn filter
async function loadFilterOptions() {
    try {
        // Load genres
        const genresResponse = await fetch(
            `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=vi-VN`
        );
        const genresData = await genresResponse.json();
        
        const genreSelect = document.getElementById('genreFilter');
        genresData.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });

        // Load countries
        const countriesResponse = await fetch(
            `${BASE_URL}/configuration/countries?api_key=${API_KEY}`
        );
        const countriesData = await countriesResponse.json();
        
        const countrySelect = document.getElementById('countryFilter');
        // Sắp xếp countries theo tên
        countriesData.sort((a, b) => a.english_name.localeCompare(b.english_name));
        countriesData.forEach(country => {
            const option = document.createElement('option');
            option.value = country.iso_3166_1;
            option.textContent = country.english_name;
            countrySelect.appendChild(option);
        });

        // Load years (từ năm hiện tại về 1970)
        const yearSelect = document.getElementById('yearFilter');
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1970; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }

    } catch (error) {
        console.error('Lỗi khi load filter options:', error);
    }
}

// Hàm toggle advanced filters
function toggleAdvancedFilters() {
    const filters = document.getElementById('advancedFilters');
    const toggleBtn = document.querySelector('.toggle-filters-btn');
    
    const isHidden = filters.classList.toggle('hidden');
    toggleBtn.classList.toggle('active');
    
    // Thay đổi icon mũi tên
    const arrow = toggleBtn.querySelector('.toggle-arrow');
    arrow.textContent = isHidden ? '▼' : '▲';
}

// Hàm tìm kiếm phim với filters
async function searchMovies(page = 1) {
    if (isLoading) return;
    
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    // Lấy các filter values
    const filters = {
        genre: document.getElementById('genreFilter').value,
        country: document.getElementById('countryFilter').value,
        year: document.getElementById('yearFilter').value,
        rating: document.getElementById('ratingFilter').value,
        sortBy: document.getElementById('sortBy').value
    };

    currentSearchQuery = query;
    currentFilters = filters;
    currentPage = page;

    showLoading(true);
    isLoading = true;
    
    try {
        let url;
        let params = [];
        
        if (query) {
            // Tìm kiếm theo keyword
            url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=vi-VN&page=${page}`;
            params.push(`query=${encodeURIComponent(query)}`);
        } else {
            // Discover movies với filters
            url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=vi-VN&page=${page}`;
            
            // Thêm filters
            if (filters.genre) params.push(`with_genres=${filters.genre}`);
            if (filters.country) params.push(`with_origin_country=${filters.country}`);
            if (filters.year) params.push(`year=${filters.year}`);
            if (filters.rating) params.push(`vote_average.gte=${filters.rating}`);
            if (filters.sortBy) params.push(`sort_by=${filters.sortBy}`);
        }

        // Thêm params vào URL
        if (params.length > 0) {
            url += `&${params.join('&')}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        totalPages = data.total_pages;
        
        // Hiển thị kết quả tìm kiếm
        const containerId = page === 1 ? 'search-results-grid' : 'search-results-grid';
        
        if (page === 1) {
            document.getElementById('search-results').classList.remove('hidden');
            displayMovies(data.results, containerId);
        } else {
            appendMovies(data.results, containerId);
        }
        
        // Hiển thị/ẩn nút Load More
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (currentPage < totalPages && data.results.length > 0) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
        
        // Hiển thị thông báo nếu không có kết quả
        if (page === 1 && (!data.results || data.results.length === 0)) {
            showNotification('Không tìm thấy kết quả phù hợp');
        }
        
        // Cuộn đến kết quả tìm kiếm (chỉ với page đầu)
        if (page === 1 && data.results.length > 0) {
            setTimeout(() => {
                document.getElementById('search-results').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
        
    } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        showNotification('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
    } finally {
        showLoading(false);
        isLoading = false;
    }
}

// Hàm load thêm phim
function loadMoreMovies() {
    if (currentPage < totalPages && !isLoading) {
        searchMovies(currentPage + 1);
    }
}

// Hàm load phim phổ biến
async function loadPopularMovies() {
    showLoading(true);
    try {
        const response = await fetch(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=vi-VN&page=1`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayMovies(data.results, 'movies-grid');
    } catch (error) {
        console.error('Lỗi khi load phim:', error);
        showNotification('Có lỗi xảy ra khi tải danh sách phim');
        // Hiển thị placeholder nếu có lỗi
        document.getElementById('movies-grid').innerHTML = 
            '<p style="color: #cccccc; text-align: center; width: 100%;">Không thể tải danh sách phim</p>';
    } finally {
        showLoading(false);
    }
}

// Hàm hiển thị danh sách phim
function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    
    if (!movies || movies.length === 0) {
        container.innerHTML = '<p style="color: #cccccc; text-align: center; width: 100%; grid-column: 1 / -1;">Không tìm thấy phim nào.</p>';
        return;
    }
    
    container.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="openMovieDetail(${movie.id})">
            <img 
                class="movie-poster" 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750/333/fff?text=No+Image'}" 
                alt="${movie.title}"
                onerror="this.src='https://via.placeholder.com/500x750/333/fff?text=No+Image'"
                loading="lazy"
            >
            <div class="movie-info">
                <div class="movie-title">${movie.title || 'Không có tiêu đề'}</div>
                <div class="movie-year">${movie.release_date ? movie.release_date.substring(0,4) : 'N/A'}</div>
                <div class="movie-rating">
                    <span class="rating-star">⭐</span>
                    <span>${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10</span>
                    <span style="margin-left: 8px; color: #888; font-size: 0.75rem;">(${movie.vote_count || 0})</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Hàm thêm phim vào grid (cho load more)
function appendMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    
    if (!movies || movies.length === 0) {
        return;
    }
    
    const moviesHTML = movies.map(movie => `
        <div class="movie-card" onclick="openMovieDetail(${movie.id})">
            <img 
                class="movie-poster" 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750/333/fff?text=No+Image'}" 
                alt="${movie.title}"
                onerror="this.src='https://via.placeholder.com/500x750/333/fff?text=No+Image'"
                loading="lazy"
            >
            <div class="movie-info">
                <div class="movie-title">${movie.title || 'Không có tiêu đề'}</div>
                <div class="movie-year">${movie.release_date ? movie.release_date.substring(0,4) : 'N/A'}</div>
                <div class="movie-rating">
                    <span class="rating-star">⭐</span>
                    <span>${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10</span>
                    <span style="margin-left: 8px; color: #888; font-size: 0.75rem;">(${movie.vote_count || 0})</span>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML += moviesHTML;
}

// Hàm mở trang chi tiết phim
async function openMovieDetail(movieId) {
    if (isLoading) return;
    
    showLoading(true);
    isLoading = true;
    
    try {
        // Lấy thông tin chi tiết phim
        const movieResponse = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=vi-VN`
        );
        if (!movieResponse.ok) {
            throw new Error(`HTTP error! status: ${movieResponse.status}`);
        }
        const movie = await movieResponse.json();
        
        // Lấy danh sách cast
        const creditsResponse = await fetch(
            `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
        );
        const credits = await creditsResponse.json();

        // Lấy trailer
        const videosResponse = await fetch(
            `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`
        );
        const videosData = await videosResponse.json();
        
        // Lưu dữ liệu phim vào localStorage
        const movieData = {
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
            cast: credits.cast ? credits.cast.slice(0, 6) : [],
            videos: videosData.results || []
        };
        
        localStorage.setItem('currentMovie', JSON.stringify(movieData));
        
        // Chuyển hướng sang trang movie-detail
        window.location.href = 'movie-detail.html';
        
    } catch (error) {
        console.error('Lỗi khi load chi tiết phim:', error);
        showNotification('Có lỗi xảy ra khi tải thông tin phim');
    } finally {
        showLoading(false);
        isLoading = false;
    }
}

// Hàm reset filters
function resetFilters() {
    document.getElementById('genreFilter').value = '';
    document.getElementById('countryFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    document.getElementById('sortBy').value = 'popularity.desc';
    document.getElementById('searchInput').value = '';
    
    // Load lại phim phổ biến
    loadPopularMovies();
    
    // Ẩn kết quả tìm kiếm
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('loadMoreBtn').classList.add('hidden');
}

// Hàm hiển thị/ẩn loading
function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

// Hàm hiển thị thông báo
function showNotification(message) {
    // Xóa thông báo cũ nếu có
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
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
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // Thêm styles nếu chưa có
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

// Hàm tìm kiếm diễn viên (bonus feature)
async function searchActors(query) {
    if (!query || query.length < 2) return [];
    
    try {
        const response = await fetch(
            `${BASE_URL}/search/person?api_key=${API_KEY}&language=vi-VN&query=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Lỗi khi tìm kiếm diễn viên:', error);
        return [];
    }
}

// Hàm hiển thị kết quả tìm kiếm diễn viên
async function showActorResults(query) {
    const actors = await searchActors(query);
    if (actors.length === 0) return;
    
    // Tạo dropdown hoặc modal hiển thị diễn viên
    // (Có thể implement thêm nếu cần)
}

// Export functions for global use
window.searchMovies = searchMovies;
window.loadMoreMovies = loadMoreMovies;
window.openMovieDetail = openMovieDetail;
window.toggleAdvancedFilters = toggleAdvancedFilters;
window.resetFilters = resetFilters;
window.applyFilters = applyFilters; // THÊM DÒNG NÀY