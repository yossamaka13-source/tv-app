/**
 * TV Streaming App - Strict ES5 JavaScript for Tizen 3.0
 * Netflix-style UI with remote control navigation
 */

// Configuration
var TMDB_API_KEY = 'c1084d318757743e08fcf5cda7ae43da';
var TMDB_BASE_URL = 'https://api.themoviedb.org/3';
var IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
var VIDEO_BASE_URL = 'https://vidsrc.to/embed/movie/';

// Application State
var movies = [];
var searchResults = [];
var currentFocusIndex = 0;
var currentSection = 'trending'; // 'trending' or 'search'
var isPlayerOpen = false;
var searchQuery = '';
var searchTimeout = null;

// DOM Elements
var searchInput = null;
var trendingRow = null;
var searchResultsRow = null;
var trendingSection = null;
var searchResultsSection = null;
var loading = null;
var noResults = null;
var videoPlayerContainer = null;
var videoIframe = null;
var closePlayerBtn = null;

// Initialize Application
function initApp() {
    // Cache DOM elements
    searchInput = document.getElementById('search-input');
    trendingRow = document.getElementById('trending-row');
    searchResultsRow = document.getElementById('search-results-row');
    trendingSection = document.getElementById('trending-section');
    searchResultsSection = document.getElementById('search-results-section');
    loading = document.getElementById('loading');
    noResults = document.getElementById('no-results');
    videoPlayerContainer = document.getElementById('video-player-container');
    videoIframe = document.getElementById('video-iframe');
    closePlayerBtn = document.getElementById('close-player-btn');

    // Show loading
    showLoading(true);

    // Load trending movies
    fetchTrendingMovies(function(error, data) {
        showLoading(false);
        if (error) {
            console.error('Error fetching trending movies:', error);
            return;
        }
        movies = data;
        renderMovies(movies, trendingRow);
        updateFocus();
    });

    // Setup search input
    setupSearch();

    // Setup keyboard event listeners
    setupEventListeners();
}

// HTTP Request using XMLHttpRequest (ES5)
function makeRequest(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    callback(null, response);
                } catch (e) {
                    callback(e, null);
                }
            } else {
                callback(new Error('HTTP Status: ' + xhr.status), null);
            }
        }
    };

    xhr.onerror = function() {
        callback(new Error('Network Error'), null);
    };

    xhr.send();
}

// Fetch Trending Movies from TMDB
function fetchTrendingMovies(callback) {
    var url = TMDB_BASE_URL + '/trending/movie/day?api_key=' + TMDB_API_KEY;
    makeRequest(url, function(error, response) {
        if (error) {
            callback(error, null);
            return;
        }
        if (response.results && response.results.length > 0) {
            callback(null, response.results);
        } else {
            callback(new Error('No movies found'), null);
        }
    });
}

// Search Movies from TMDB
function searchMovies(query, callback) {
    var encodedQuery = encodeURIComponent(query);
    var url = TMDB_BASE_URL + '/search/movie?api_key=' + TMDB_API_KEY + '&query=' + encodedQuery;
    makeRequest(url, function(error, response) {
        if (error) {
            callback(error, null);
            return;
        }
        if (response.results && response.results.length > 0) {
            callback(null, response.results);
        } else {
            callback(null, []);
        }
    });
}

// Get Current Movie List based on section
function getCurrentMovies() {
    if (currentSection === 'trending') {
        return movies;
    } else {
        return searchResults;
    }
}

// Render Movies in a Row
function renderMovies(movieList, container) {
    container.innerHTML = '';

    if (!movieList || movieList.length === 0) {
        return;
    }

    for (var i = 0; i < movieList.length; i++) {
        var movie = movieList[i];
        var posterPath = movie.poster_path;

        if (!posterPath) {
            continue; // Skip movies without posters
        }

        var posterUrl = IMAGE_BASE_URL + posterPath;
        var poster = createPosterElement(movie, posterUrl);
        container.appendChild(poster);
    }
}

// Create Poster Element
function createPosterElement(movie, posterUrl) {
    var poster = document.createElement('div');
    poster.className = 'poster';
    poster.setAttribute('data-id', movie.id);
    poster.setAttribute('data-title', movie.title || movie.name);
    poster.setAttribute('tabindex', '0');

    var img = document.createElement('img');
    img.src = posterUrl;
    img.alt = movie.title || movie.name;
    img.setAttribute('loading', 'lazy');

    poster.appendChild(img);

    return poster;
}

// Update Focus State
function updateFocus() {
    var currentMovies = getCurrentMovies();
    var container = currentSection === 'trending' ? trendingRow : searchResultsRow;
    var posters = container.getElementsByClassName('poster');

    // Remove focus from all posters
    for (var i = 0; i < posters.length; i++) {
        posters[i].classList.remove('focused');
    }

    // Add focus to current poster
    if (posters.length > 0 && currentFocusIndex >= 0 && currentFocusIndex < posters.length) {
        var focusedPoster = posters[currentFocusIndex];
        focusedPoster.classList.add('focused');
        focusedPoster.focus();

        // Scroll poster into view
        focusedPoster.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}

// Setup Search Input
function setupSearch() {
    if (!searchInput) {
        return;
    }

    searchInput.addEventListener('input', function(event) {
        var query = event.target.value.trim();

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (query === '') {
            // Clear search and show trending
            searchQuery = '';
            currentSection = 'trending';
            currentFocusIndex = 0;
            searchResultsSection.classList.add('hidden');
            trendingSection.classList.remove('hidden');
            updateFocus();
            return;
        }

        searchQuery = query;

        // Debounce search
        searchTimeout = setTimeout(function() {
            performSearch(query);
        }, 500);
    });
}

// Perform Search
function performSearch(query) {
    showLoading(true);
    searchMovies(query, function(error, data) {
        showLoading(false);

        if (error) {
            console.error('Search error:', error);
            return;
        }

        searchResults = data;
        currentSection = 'search';
        currentFocusIndex = 0;

        // Show search results section
        trendingSection.classList.add('hidden');
        searchResultsSection.classList.remove('hidden');

        if (searchResults.length === 0) {
            noResults.classList.remove('hidden');
            searchResultsRow.innerHTML = '';
        } else {
            noResults.classList.add('hidden');
            renderMovies(searchResults, searchResultsRow);
            updateFocus();
        }
    });
}

// Show/Hide Loading
function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Setup Event Listeners for Navigation
function setupEventListeners() {
    // Listen for keydown events on document
    document.addEventListener('keydown', handleKeyDown);

    // Setup close player button
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }
}

// Handle Keyboard Events (Remote Control)
function handleKeyDown(event) {
    var keyCode = event.keyCode;

    // Handle Return key (Tizen specific: 10009)
    if (keyCode === 10009 || keyCode === 27) { // 27 is Escape key
        if (isPlayerOpen) {
            closePlayer();
            event.preventDefault();
            return;
        }
    }

    // If player is open, only handle return key
    if (isPlayerOpen) {
        return;
    }

    var currentMovies = getCurrentMovies();
    if (!currentMovies || currentMovies.length === 0) {
        return;
    }

    var container = currentSection === 'trending' ? trendingRow : searchResultsRow;
    var posters = container.getElementsByClassName('poster');

    if (posters.length === 0) {
        return;
    }

    var maxIndex = posters.length - 1;

    switch (keyCode) {
        case 37: // Left Arrow
            event.preventDefault();
            currentFocusIndex--;
            if (currentFocusIndex < 0) {
                currentFocusIndex = maxIndex;
            }
            updateFocus();
            break;

        case 39: // Right Arrow
            event.preventDefault();
            currentFocusIndex++;
            if (currentFocusIndex > maxIndex) {
                currentFocusIndex = 0;
            }
            updateFocus();
            break;

        case 38: // Up Arrow
            // Could navigate between sections in future
            event.preventDefault();
            break;

        case 40: // Down Arrow
            // Could navigate to details in future
            event.preventDefault();
            break;

        case 13: // Enter Key
            event.preventDefault();
            openPlayer();
            break;
    }
}

// Open Video Player
function openPlayer() {
    var currentMovies = getCurrentMovies();
    if (currentMovies.length === 0) {
        return;
    }

    var movie = currentMovies[currentFocusIndex];
    if (!movie || !movie.id) {
        return;
    }

    var videoUrl = VIDEO_BASE_URL + movie.id;
    videoIframe.src = videoUrl;
    videoPlayerContainer.classList.remove('hidden');
    isPlayerOpen = true;

    // Focus on close button for accessibility
    closePlayerBtn.focus();
}

// Close Video Player
function closePlayer() {
    videoIframe.src = '';
    videoPlayerContainer.classList.add('hidden');
    isPlayerOpen = false;

    // Restore focus to last selected poster
    updateFocus();
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
