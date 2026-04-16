class MovieDetail {
  constructor() {
    this.isWatchlistAdded = false;
    this.isLiked = false;
    this.movieData = null;
    this.similarMovies = [];
    this.featuredMovies = [];
    this.currentMovieIndex = 0;
    this.API_KEY = "56c1a98ede8d3aa9bc86e4a1ea319297";
    this.BASE_URL = "https://api.themoviedb.org/3";
    this.init();
  }

  async init() {
    await this.loadMovieData();
    this.loadWatchlistState();
    await this.loadFeaturedMovies();
    this.bindEvents();
    this.setupNavigation();
  }

  async loadMovieData() {
    const savedMovieData = localStorage.getItem("currentMovie");

    if (savedMovieData) {
      this.movieData = JSON.parse(savedMovieData);
      await this.loadSimilarMovies();
      this.updateMovieUI();
    } else {
      await this.loadDefaultMovie();
    }
  }

  async loadDefaultMovie() {
    try {
      this.showNotification("Đang tải phim mặc định...");
      const response = await fetch(
        `${this.BASE_URL}/movie/550?api_key=${this.API_KEY}&language=vi-VN`,
      );
      const movie = await response.json();

      const creditsResponse = await fetch(
        `${this.BASE_URL}/movie/550/credits?api_key=${this.API_KEY}`,
      );
      const credits = await creditsResponse.json();

      this.movieData = {
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview || "Chưa có mô tả cho phim này.",
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        runtime: movie.runtime,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        genres: movie.genres || [],
        cast: credits.cast ? credits.cast.slice(0, 6) : [],
        videos: [],
      };
      localStorage.setItem("currentMovie", JSON.stringify(this.movieData));
      await this.loadSimilarMovies();
      this.updateMovieUI();
    } catch (error) {
      console.error("Lỗi load phim mặc định:", error);
      this.showNotification("Không thể tải dữ liệu phim");
    }
  }

  async loadFeaturedMovies() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/movie/popular?api_key=${this.API_KEY}&language=vi-VN&page=1`,
      );
      const data = await response.json();
      this.featuredMovies = data.results.slice(0, 8);
      this.updateFeaturedMoviesUI();
    } catch (error) {
      console.error("Lỗi khi load phim nổi bật:", error);
      this.showFeaturedMoviesError();
    }
  }

  updateFeaturedMoviesUI() {
    const featuredMoviesGrid = document.getElementById("featuredMoviesGrid");

    if (!this.featuredMovies || this.featuredMovies.length === 0) {
      featuredMoviesGrid.innerHTML =
        '<p class="featured-movies-placeholder">Không có phim nổi bật</p>';
      return;
    }

    const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300";

    featuredMoviesGrid.innerHTML = this.featuredMovies
      .map(
        (movie) => `
            <div class="featured-movie-card" data-movie-id="${movie.id}">
                <img src="${movie.poster_path ? POSTER_BASE_URL + movie.poster_path : "https://placehold.co/300x450/1a1a1a/666?text=No+Image"}" 
                     alt="${movie.title}" 
                     class="featured-movie-poster">
                <div class="featured-movie-info">
                    <h3 class="featured-movie-title">${movie.title}</h3>
                    <div class="featured-movie-meta">
                        <span class="featured-movie-year">${movie.release_date ? movie.release_date.substring(0, 4) : "N/A"}</span>
                        <span class="featured-movie-rating">⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    this.bindFeaturedMoviesEvents();
  }

  bindFeaturedMoviesEvents() {
    document.querySelectorAll(".featured-movie-card").forEach((card) => {
      card.addEventListener("click", async () => {
        const movieId = card.getAttribute("data-movie-id");
        await this.loadMovieById(movieId);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  showFeaturedMoviesError() {
    const featuredMoviesGrid = document.getElementById("featuredMoviesGrid");
    featuredMoviesGrid.innerHTML =
      '<p class="featured-movies-placeholder">Không thể tải danh sách phim nổi bật</p>';
  }

  async loadMovieById(movieId) {
    try {
      this.showNotification("Đang tải phim...");

      const movieResponse = await fetch(
        `${this.BASE_URL}/movie/${movieId}?api_key=${this.API_KEY}&language=vi-VN`,
      );
      const movie = await movieResponse.json();

      const creditsResponse = await fetch(
        `${this.BASE_URL}/movie/${movieId}/credits?api_key=${this.API_KEY}`,
      );
      const credits = await creditsResponse.json();

      this.movieData = {
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview || "Chưa có mô tả cho phim này.",
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        runtime: movie.runtime,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        genres: movie.genres || [],
        cast: credits.cast ? credits.cast.slice(0, 6) : [],
        videos: [],
      };

      localStorage.setItem("currentMovie", JSON.stringify(this.movieData));
      this.isWatchlistAdded = false;
      this.isLiked = false;
      this.loadWatchlistState();
      this.resetLikeButton();
      this.updateMovieUI();
      await this.loadSimilarMovies();
      this.showNotification(`Đã chuyển sang: ${movie.title}`);
    } catch (error) {
      console.error("Lỗi khi load phim:", error);
      this.showNotification("Có lỗi khi tải thông tin phim");
    }
  }

  async loadSimilarMovies() {
    if (!this.movieData) return;

    try {
      const response = await fetch(
        `${this.BASE_URL}/movie/${this.movieData.id}/similar?api_key=${this.API_KEY}&language=vi-VN&page=1`,
      );
      const data = await response.json();
      this.similarMovies = data.results.slice(0, 4);
      this.updateNavigationDots();
    } catch (error) {
      console.error("Lỗi khi load phim tương tự:", error);
    }
  }

  updateMovieUI() {
    if (!this.movieData) return;

    const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
    const backgroundImage = document.getElementById("backgroundImage");

    if (this.movieData.backdrop_path) {
      backgroundImage.src = BACKDROP_BASE_URL + this.movieData.backdrop_path;
    } else if (this.movieData.poster_path) {
      backgroundImage.src = BACKDROP_BASE_URL + this.movieData.poster_path;
    } else {
      backgroundImage.src =
        "https://placehold.co/1920x1080/1a1a1a/666?text=No+Image";
    }

    document.getElementById("movieTitle").textContent = this.movieData.title;
    document.getElementById("releaseYear").textContent = this.movieData
      .release_date
      ? this.movieData.release_date.substring(0, 4)
      : "N/A";
    document.getElementById("runtime").textContent = this.movieData.runtime
      ? `${this.movieData.runtime} phút`
      : "N/A";
    document.getElementById("genres").textContent =
      this.movieData.genres && this.movieData.genres.length > 0
        ? this.movieData.genres.map((g) => g.name).join(" • ")
        : "N/A";
    document.getElementById("rating").textContent = this.movieData.vote_average
      ? `⭐ ${this.movieData.vote_average.toFixed(1)}/10`
      : "N/A";
    document.getElementById("overview").textContent = this.movieData.overview;
    this.updateCastUI();
    document.title = `MEGAFILM - ${this.movieData.title}`;
  }

  updateCastUI() {
    const castGrid = document.getElementById("castGrid");

    if (!this.movieData.cast || this.movieData.cast.length === 0) {
      castGrid.innerHTML =
        '<p style="color: #888; text-align: center; width: 100%;">Không có thông tin diễn viên</p>';
      return;
    }

    const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w200";

    castGrid.innerHTML = this.movieData.cast
      .map(
        (actor) => `
            <div class="cast-card">
                <img src="${actor.profile_path ? POSTER_BASE_URL + actor.profile_path : "https://placehold.co/120x120/1a1a1a/666?text=No+Image"}" 
                     alt="${actor.name}" 
                     class="cast-photo">
                <div class="cast-info">
                    <h3 class="cast-name">${actor.name}</h3>
                    <p class="cast-character">${actor.character || "N/A"}</p>
                </div>
            </div>
        `,
      )
      .join("");
  }

  updateNavigationDots() {
    const dotsContainer = document.getElementById("navDots");
    const totalMovies = this.similarMovies.length + 1;
    dotsContainer.innerHTML = "";

    for (let i = 0; i < totalMovies; i++) {
      const dot = document.createElement("button");
      dot.className = `nav-dot ${i === this.currentMovieIndex ? "active" : ""}`;
      dot.addEventListener("click", () => this.goToMovie(i));
      dotsContainer.appendChild(dot);
    }
  }

  async navigate(direction) {
    const totalMovies = this.similarMovies.length + 1;
    this.currentMovieIndex =
      (this.currentMovieIndex + direction + totalMovies) % totalMovies;

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
    await this.loadMovieById(movieId);
  }

  resetLikeButton() {
    const likeBtn = document.getElementById("likeBtn");
    if (likeBtn) {
      likeBtn.classList.remove("liked");
      likeBtn.innerHTML = '<span class="thumbs-up-icon">👍</span> Like';
    }
  }

  setupNavigation() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) prevBtn.addEventListener("click", () => this.navigate(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => this.navigate(1));
  }

  bindEvents() {
    document
      .getElementById("watchNowBtn")
      ?.addEventListener("click", () => this.watchNow());
    document
      .getElementById("watchlistBtn")
      ?.addEventListener("click", () => this.toggleWatchlist());
    document
      .getElementById("likeBtn")
      ?.addEventListener("click", () => this.toggleLike());
    document
      .getElementById("downloadBtn")
      ?.addEventListener("click", () => this.downloadMovie());
    document
      .getElementById("shareBtn")
      ?.addEventListener("click", () => this.shareMovie());
    document
      .getElementById("trailerBtn")
      ?.addEventListener("click", () => this.showTrailer());
    document
      .getElementById("closeTrailer")
      ?.addEventListener("click", () => this.closeTrailer());
    document
      .querySelector(".search-btn")
      ?.addEventListener("click", () => this.openSearch());
    document
      .querySelector(".history-btn")
      ?.addEventListener("click", () => this.openHistory());

    const trailerModal = document.getElementById("trailerModal");
    trailerModal?.addEventListener("click", (e) => {
      if (e.target === trailerModal) this.closeTrailer();
    });
  }

  openSearch() {
    window.location.href = "search.html";
  }

  openHistory() {
    this.showNotification("Opening watch history...");
  }

  watchNow() {
    if (this.movieData) {
      localStorage.setItem("currentMovie", JSON.stringify(this.movieData));
      setTimeout(() => (window.location.href = "watch-video.html"), 100);
    } else {
      window.location.href = "watch-video.html";
    }
  }

  toggleWatchlist() {
    const watchlistBtn = document.getElementById("watchlistBtn");
    this.isWatchlistAdded = !this.isWatchlistAdded;

    if (this.isWatchlistAdded) {
      watchlistBtn.innerHTML =
        '<span class="btn-icon">✓</span> Added to Watchlist';
      watchlistBtn.classList.add("added");
      this.saveWatchlistState(true);
      this.showNotification("Added to Watchlist!");
    } else {
      watchlistBtn.innerHTML = '<span class="btn-icon">+</span> Add Watchlist';
      watchlistBtn.classList.remove("added");
      this.saveWatchlistState(false);
      this.showNotification("Removed from Watchlist!");
    }
  }

  loadWatchlistState() {
    if (!this.movieData) return;
    const savedState = localStorage.getItem(`watchlist_${this.movieData.id}`);
    if (savedState === "true") {
      this.isWatchlistAdded = true;
      const watchlistBtn = document.getElementById("watchlistBtn");
      if (watchlistBtn) {
        watchlistBtn.innerHTML =
          '<span class="btn-icon">✓</span> Added to Watchlist';
        watchlistBtn.classList.add("added");
      }
    }
  }

  saveWatchlistState(state) {
    if (!this.movieData) return;
    localStorage.setItem(`watchlist_${this.movieData.id}`, state.toString());
  }

  toggleLike() {
    const likeBtn = document.getElementById("likeBtn");
    this.isLiked = !this.isLiked;

    if (this.isLiked) {
      likeBtn.classList.add("liked");
      likeBtn.innerHTML = '<span class="thumbs-up-icon">👍</span> Liked';
      this.showNotification("You liked this movie!");
    } else {
      likeBtn.classList.remove("liked");
      likeBtn.innerHTML = '<span class="thumbs-up-icon">👍</span> Like';
      this.showNotification("You unliked this movie!");
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
        url: window.location.href,
      });
    } else {
      this.showNotification(`Share this movie: ${this.movieData.title}`);
    }
  }

  async showTrailer() {
    if (!this.movieData) return;
    this.showNotification("Tính năng trailer đang phát triển");
  }

  closeTrailer() {
    const trailerModal = document.getElementById("trailerModal");
    trailerModal.classList.add("hidden");
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: #b30000;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MovieDetail();
});
