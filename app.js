/**
 * TV Streaming App - ES5 Compatible (Tizen 3.0)
 * Ad-light embed source, Samsung 2017 compatible
 */

// ================= CONFIG =================
var TMDB_API_KEY = 'c1084d318757743e08fcf5cda7ae43da';
var TMDB_BASE_URL = 'https://api.themoviedb.org/3';
var IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/*
 * Changed video provider:
 * - More stable on old Samsung TVs
 * - Less aggressive ads than vidsrc.to
 */
var VIDEO_BASE_URL = 'https://vidsrc.cc/v2/embed/movie/';

// ============== STATE ====================
var movies = [];
var searchResults = [];
var currentFocusIndex = 0;
var currentSection = 'trending';
var isPlayerOpen = false;
var searchTimeout = null;

// ============== DOM ======================
var searchInput;
var trendingRow;
var searchResultsRow;
var trendingSection;
var searchResultsSection;
var loading;
var noResults;
var videoPlayerContainer;
var videoIframe;
var closePlayerBtn;

// ============== INIT =====================
function initApp() {
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

    showLoading(true);

    fetchTrendingMovies(function (err, data) {
        showLoading(false);
        if (err) {
            console.log(err);
            return;
        }
        movies = data;
        renderMovies(movies, trendingRow);
        updateFocus();
    });

    setupSearch();
    setupEvents();
}

// ============== HTTP =====================
function makeRequest(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    callback(null, JSON.parse(xhr.responseText));
                } catch (e) {
                    callback(e, null);
                }
            } else {
                callback(new Error('HTTP ' + xhr.status), null);
            }
        }
    };
    xhr.send();
}

// ============== TMDB =====================
function fetchTrendingMovies(cb) {
    var url = TMDB_BASE_URL + '/trending/movie/day?api_key=' + TMDB_API_KEY;
    makeRequest(url, function (err, res) {
        if (err || !res.results) {
            cb(err || new Error('No data'), null);
            return;
        }
        cb(null, res.results);
    });
}

function searchMovies(query, cb) {
    var url = TMDB_BASE_URL + '/search/movie?api_key=' + TMDB_API_KEY +
              '&query=' + encodeURIComponent(query);
    makeRequest(url, function (err, res) {
        cb(err, res && res.results ? res.results : []);
    });
}

// ============== UI =======================
function renderMovies(list, container) {
    container.innerHTML = '';
    for (var i = 0; i < list.length; i++) {
        if (!list[i].poster_path) continue;
        container.appendChild(createPoster(list[i]));
    }
}

function createPoster(movie) {
    var div = document.createElement('div');
    div.className = 'poster';
    div.setAttribute('data-id', movie.id);
    div.tabIndex = 0;

    var img = document.createElement('img');
    img.src = IMAGE_BASE_URL + movie.poster_path;
    img.alt = movie.title;

    div.appendChild(img);
    return div;
}

function updateFocus() {
    var container = currentSection === 'trending' ? trendingRow : searchResultsRow;
    var posters = container.getElementsByClassName('poster');

    for (var i = 0; i < posters.length; i++) {
        posters[i].classList.remove('focused');
    }

    if (posters[currentFocusIndex]) {
        posters[currentFocusIndex].classList.add('focused');
        posters[currentFocusIndex].focus();
        posters[currentFocusIndex].scrollIntoView(false);
    }
}

// ============== SEARCH ===================
function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        var q = e.target.value.trim();

        if (searchTimeout) clearTimeout(searchTimeout);

        if (!q) {
            currentSection = 'trending';
            trendingSection.classList.remove('hidden');
            searchResultsSection.classList.add('hidden');
            currentFocusIndex = 0;
            updateFocus();
            return;
        }

        searchTimeout = setTimeout(function () {
            showLoading(true);
            searchMovies(q, function (err, res) {
                showLoading(false);
                searchResults = res;
                currentSection = 'search';
                currentFocusIndex = 0;
                trendingSection.classList.add('hidden');
                searchResultsSection.classList.remove('hidden');
                renderMovies(searchResults, searchResultsRow);
                updateFocus();
            });
        }, 500);
    });
}

// ============== PLAYER ===================
function openPlayer() {
    var list = currentSection === 'trending' ? movies : searchResults;
    var movie = list[currentFocusIndex];
    if (!movie) return;

    videoIframe.src = VIDEO_BASE_URL + movie.id;
    videoPlayerContainer.classList.remove('hidden');
    isPlayerOpen = true;
    closePlayerBtn.focus();
}

function closePlayer() {
    videoIframe.src = '';
    videoPlayerContainer.classList.add('hidden');
    isPlayerOpen = false;
    updateFocus();
}

// ============== EVENTS ===================
function setupEvents() {
    document.addEventListener('keydown', function (e) {
        var code = e.keyCode;

        if ((code === 10009 || code === 27) && isPlayerOpen) {
            closePlayer();
            e.preventDefault();
            return;
        }

        if (isPlayerOpen) return;

        var container = currentSection === 'trending' ? trendingRow : searchResultsRow;
        var posters = container.getElementsByClassName('poster');
        if (!posters.length) return;

        if (code === 37) {
            currentFocusIndex = (currentFocusIndex - 1 + posters.length) % posters.length;
        } else if (code === 39) {
            currentFocusIndex = (currentFocusIndex + 1) % posters.length;
        } else if (code === 13) {
            openPlayer();
            return;
        } else {
            return;
        }

        e.preventDefault();
        updateFocus();
    });

    closePlayerBtn.addEventListener('click', closePlayer);
}

// ============== UTIL =====================
function showLoading(show) {
    loading.classList[show ? 'remove' : 'add']('hidden');
}

// ============== START ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
