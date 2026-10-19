(function () {
	'use strict';

	var EVENT_DATE = new Date(2026, 10, 3); // 2026-11-03 (月は0始まり)

	/* ---------- ページ上部へ戻る ---------- */
	var logo = document.getElementById('js-scroll-top');
	if (logo) {
		var toTop = function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			if (location.hash && history.replaceState) {
				history.replaceState(null, '', location.pathname + location.search);
			}
		};
		logo.addEventListener('click', toTop);
		logo.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toTop();
			}
		});
	}

	/* ---------- ハンバーガーメニュー（SP） ---------- */
	var root = document.documentElement;
	var navToggle = document.getElementById('js-nav-toggle');
	var nav = document.getElementById('js-nav');
	if (navToggle && nav) {
		var setNav = function (open) {
			root.classList.toggle('is-nav-open', open);
			navToggle.setAttribute('aria-expanded', String(open));
			navToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
		};
		navToggle.addEventListener('click', function () {
			setNav(!root.classList.contains('is-nav-open'));
		});
		nav.addEventListener('click', function (e) {
			if (e.target.closest('a') || e.target.hasAttribute('data-nav-close')) {
				setNav(false);
			}
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && root.classList.contains('is-nav-open')) {
				setNav(false);
				navToggle.focus();
			}
		});
		window.matchMedia('(min-width: 769px)').addEventListener('change', function (e) {
			if (e.matches) { setNav(false); }
		});
	}

	/* ---------- 開催までのカウントダウン ---------- */
	var countWrap = document.getElementById('js-countdown');
	var countNum = document.getElementById('js-countdown-num');
	if (countWrap && countNum) {
		var now = new Date();
		var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		var days = Math.round((EVENT_DATE - today) / 86400000);
		if (days > 0) {
			countNum.textContent = days;
			countWrap.hidden = false;
		} else if (days === 0) {
			countWrap.textContent = '本日開催です！';
			countWrap.hidden = false;
		}
	}

	/* ---------- スクロール表示 ---------- */
	var reveals = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				}
			});
		}, { threshold: 0.08 });
		reveals.forEach(function (el) { io.observe(el); });
	} else {
		reveals.forEach(function (el) { el.classList.add('is-visible'); });
	}

	/* ---------- FAQ ---------- */
	var list = document.getElementById('js-faq-list');
	if (!list) { return; }

	var items = Array.prototype.slice.call(list.querySelectorAll('.faq-item'));
	var chips = Array.prototype.slice.call(document.querySelectorAll('[data-faq-filter]'));
	var searchInput = document.getElementById('js-faq-search');
	var statusEl = document.getElementById('js-faq-status');
	var emptyEl = document.getElementById('js-faq-empty');
	var toggleBtn = document.getElementById('js-faq-toggle');
	var faqSection = document.getElementById('faq');

	var state = { cat: 'all', query: '' };

	function normalize(str) {
		return (str || '').normalize('NFKC').toLowerCase();
	}

	items.forEach(function (item) {
		item.dataset.search = normalize(item.textContent);
	});

	function matches(item) {
		if (state.cat !== 'all' && item.dataset.cat !== state.cat) { return false; }
		if (!state.query) { return true; }
		return state.query.split(/\s+/).every(function (word) {
			return item.dataset.search.indexOf(word) !== -1;
		});
	}

	function countByCat() {
		var counts = { all: items.length };
		items.forEach(function (item) {
			counts[item.dataset.cat] = (counts[item.dataset.cat] || 0) + 1;
		});
		chips.forEach(function (chip) {
			var badge = chip.querySelector('.faq-cat__count');
			if (badge) { badge.textContent = counts[chip.dataset.faqFilter] || 0; }
		});
	}

	function updateToggleLabel() {
		var visible = items.filter(function (item) { return !item.hidden; });
		var allOpen = visible.length > 0 && visible.every(function (item) { return item.open; });
		toggleBtn.textContent = allOpen ? 'すべて閉じる' : 'すべて開く';
		toggleBtn.disabled = visible.length === 0;
	}

	function apply() {
		var shown = 0;
		items.forEach(function (item) {
			var ok = matches(item);
			item.hidden = !ok;
			if (ok) { shown += 1; }
		});
		chips.forEach(function (chip) {
			chip.setAttribute('aria-pressed', String(chip.dataset.faqFilter === state.cat));
		});
		emptyEl.hidden = shown !== 0;
		statusEl.textContent = shown + '件の質問を表示しています';
		updateToggleLabel();
	}

	function setCat(cat) {
		state.cat = cat;
		apply();
	}

	chips.forEach(function (chip) {
		chip.addEventListener('click', function () {
			setCat(chip.dataset.faqFilter);
		});
	});

	if (searchInput) {
		searchInput.addEventListener('input', function () {
			state.query = normalize(searchInput.value).trim();
			apply();
		});
	}

	toggleBtn.addEventListener('click', function () {
		var visible = items.filter(function (item) { return !item.hidden; });
		var allOpen = visible.every(function (item) { return item.open; });
		visible.forEach(function (item) { item.open = !allOpen; });
		updateToggleLabel();
	});

	items.forEach(function (item) {
		item.addEventListener('toggle', updateToggleLabel);
	});

	/* ジャンル指定リンク（ヘッダー・各セクション末尾・追従ボタン） */
	document.querySelectorAll('[data-faq-cat]').forEach(function (link) {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			if (searchInput) {
				searchInput.value = '';
				state.query = '';
			}
			setCat(link.dataset.faqCat);
			faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			if (history.replaceState) { history.replaceState(null, '', '#faq'); }
		});
	});

	/* 質問への直リンク（#q-xxx）。フィルタを解除して該当項目を開く */
	function openFromHash() {
		var id = decodeURIComponent(location.hash.replace('#', ''));
		if (!id) { return; }
		var target = document.getElementById(id);
		if (!target || !target.classList.contains('faq-item')) { return; }
		if (searchInput) {
			searchInput.value = '';
			state.query = '';
		}
		state.cat = 'all';
		apply();
		target.open = true;
		target.classList.remove('is-target');
		void target.offsetWidth;
		target.classList.add('is-target');
		window.setTimeout(function () {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 30);
	}

	window.addEventListener('hashchange', openFromHash);

	countByCat();
	apply();
	openFromHash();

	/* ---------- 追従FAQボタン（FAQ表示中は隠す） ---------- */
	var fab = document.getElementById('js-fab-faq');
	if (fab && 'IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			fab.classList.toggle('is-hidden', entries[0].isIntersecting);
		}, { threshold: 0 }).observe(faqSection);
	}
})();
