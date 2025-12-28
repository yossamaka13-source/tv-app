(function () {
    'use strict';

    /* ================= CONFIG ================= */
    var API_KEY = 'c1084d318757743e08fcf5cda7ae43da';
    var TMDB = 'https://api.themoviedb.org/3';
    var IMG = 'https://image.tmdb.org/t/p/w342';

    /* ================= STATE ================= */
    var rowsData = [];
    var focusRow = 0;
    var focusCol = 0;
    var isPlayerOpen = false;

    /* ================= ELEMENTS ================= */
    var rowsEl = document.getElementById('rows');
    var playerOverlay = document.getElementById('playerOverlay');
    var playerFrame = document.getElementById('playerFrame');

    /* ================= API ================= */
    function fetchRow(title, url, type) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                createRow(title, data.results || [], type);
            }
        };
        xhr.send();
    }

    /* ================= UI ================= */
    function createRow(title, items, type) {
        var rowIndex = rowsData.length;
        rowsData.push({ items: items, type: type });

        var row = document.createElement('div');
        row.className = 'row';

        var titleEl = document.createElement('div');
        titleEl.className = 'row-title';
        titleEl.innerHTML = title;

        var posterRow = document.createElement('div');
        posterRow.className = 'poster-row';

        var i;
        for (i = 0; i < items.length && i < 15; i++) {
            var poster = document.createElement('div');
            poster.className = 'poster';
            poster.style.backgroundImage = items[i].poster_path
                ? 'url(' + IMG + items[i].poster_path + ')'
                : '';

            poster.setAttribute('data-row', rowIndex);
            poster.setAttribute('data-col', i);
            poster.setAttribute('data-id', items[i].id);
            posterRow.appendChild(poster);
        }

        row.appendChild(titleEl);
        row.appendChild(posterRow);
        rowsEl.appendChild(row);

        if (rowsData.length === 1) {
            setFocus(0, 0);
        }
    }

    /* ================= FOCUS ================= */
    function setFocus(r, c) {
        var old = document.querySelector('.poster.focused');
        if (old) {
            old.className = 'poster';
        }

        focusRow = r;
        focusCol = c;

        var selector = '.poster[data-row="' + r + '"][data-col="' + c + '"]';
        var el = document.querySelector(selector);
        if (!el) return;

        el.className = 'poster focused';
        el.scrollIntoView(false);
    }

    /* ================= PLAYER ================= */
    function openPlayer() {
        var rowInfo = rowsData[focusRow];
        var item = rowInfo.items[focusCol];
        var src = '';

        if (rowInfo.type === 'movie') {
            src = 'https://vidsrc.to/embed/movie/' + item.id;
        } else {
            src = 'https://vidsrc.to/embed/tv/' + item.id + '/1/1';
        }

        isPlayerOpen = true;
        playerFrame.src = src;
        playerOverlay.className = '';
    }

    function closePlayer() {
        isPlayerOpen = false;
        playerFrame.src = '';
        playerOverlay.className = 'hidden';
    }

    /* ================= REMOTE ================= */
    document.addEventListener('keydown', function (e) {
        var key = e.keyCode;

        if (isPlayerOpen) {
            if (key === 10009) {
                closePlayer();
            }
            return;
        }

        if (key === 37 && focusCol > 0) {
            setFocus(focusRow, focusCol - 1);
        }
        if (key === 39 && focusCol < rowsData[focusRow].items.length - 1) {
            setFocus(focusRow, focusCol + 1);
        }
        if (key === 38 && focusRow > 0) {
            setFocus(focusRow - 1, 0);
        }
        if (key === 40 && focusRow < rowsData.length - 1) {
            setFocus(focusRow + 1, 0);
        }
        if (key === 13) {
            openPlayer();
        }
    });

    /* ================= INIT ================= */
    fetchRow(
        'Trending Movies',
        TMDB + '/trending/movie/week?api_key=' + API_KEY,
        'movie'
    );

    fetchRow(
        'Popular TV Shows',
        TMDB + '/tv/popular?api_key=' + API_KEY,
        'tv'
    );

})();
