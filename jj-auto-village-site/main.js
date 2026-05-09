(function () {
  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var header = document.querySelector(".site-header");
  var yearEl = document.querySelector("[data-year]");
  var reviewForm = document.getElementById("review-form");
  var reviewsList = document.getElementById("reviews-list");
  var reviewFormMsg = document.getElementById("review-form-msg");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (reviewForm && reviewsList) {
    var STORAGE_KEY = "jj-auto-village-reviews";

    function loadReviews() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        var parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed;
      } catch (e) {
        return [];
      }
    }

    function saveReviews(reviews) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      } catch (e) {
        // ignore
      }
    }

    function renderReviews() {
      var reviews = loadReviews();
      reviewsList.innerHTML = "";
      if (reviews.length === 0) {
        var empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No reviews yet. Be the first to share your experience.";
        reviewsList.appendChild(empty);
        return;
      }

      reviews
        .slice()
        .reverse()
        .forEach(function (review) {
          var item = document.createElement("article");
          item.className = "review-item";

          var meta = document.createElement("div");
          meta.className = "review-meta";

          var category = document.createElement("span");
          category.textContent = review.category || "Service";

          var rating = document.createElement("span");
          rating.className = "review-rating";
          rating.textContent = (review.rating || "5") + " / 5";

          meta.appendChild(category);
          meta.appendChild(rating);

          var name = document.createElement("p");
          name.className = "review-name";
          name.textContent = review.name || "Customer";

          var stars = document.createElement("p");
          stars.className = "review-stars";
          stars.textContent = makeStars(review.rating);

          var text = document.createElement("p");
          text.className = "review-text";
          text.textContent = review.text || "";

          item.appendChild(meta);
          item.appendChild(name);
          item.appendChild(stars);
          item.appendChild(text);

          if (Array.isArray(review.media) && review.media.length > 0) {
            var mediaWrap = document.createElement("div");
            mediaWrap.className = "review-media";

            review.media.forEach(function (media) {
              if (!media || !media.dataUrl || !media.type) return;
              if (String(media.type).indexOf("image/") === 0) {
                var img = document.createElement("img");
                img.src = media.dataUrl;
                img.alt = "Customer review photo";
                img.loading = "lazy";
                mediaWrap.appendChild(img);
              } else if (String(media.type).indexOf("video/") === 0) {
                var video = document.createElement("video");
                video.src = media.dataUrl;
                video.controls = true;
                video.preload = "metadata";
                mediaWrap.appendChild(video);
              }
            });

            if (mediaWrap.children.length > 0) {
              item.appendChild(mediaWrap);
            }
          }

          reviewsList.appendChild(item);
        });
    }

    function makeStars(value) {
      var ratingNum = Number(value) || 0;
      if (ratingNum < 1) ratingNum = 1;
      if (ratingNum > 5) ratingNum = 5;
      return "★".repeat(ratingNum) + "☆".repeat(5 - ratingNum);
    }

    function readFileAsDataUrl(file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          resolve({
            type: file.type || "",
            name: file.name || "",
            dataUrl: String(reader.result || ""),
          });
        };
        reader.onerror = function () {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      });
    }

    reviewForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var formData = new FormData(reviewForm);
      var name = String(formData.get("name") || "").trim();
      var category = String(formData.get("category") || "").trim();
      var rating = String(formData.get("rating") || "").trim();
      var text = String(formData.get("text") || "").trim();
      var mediaFiles = Array.from(
        /** @type {FileList} */ (reviewForm.querySelector('input[name="media"]').files || [])
      );

      if (!name || !category || !rating || !text) {
        return;
      }

      if (reviewFormMsg) reviewFormMsg.textContent = "";

      var validMediaFiles = mediaFiles
        .filter(function (file) {
          return (
            (file.type.indexOf("image/") === 0 || file.type.indexOf("video/") === 0) &&
            file.size <= 10 * 1024 * 1024
          );
        })
        .slice(0, 4);

      var media = [];
      if (validMediaFiles.length > 0) {
        try {
          media = await Promise.all(validMediaFiles.map(readFileAsDataUrl));
        } catch (e) {
          if (reviewFormMsg) {
            reviewFormMsg.textContent = "Some files could not be uploaded. Please try again.";
          }
        }
      }

      var reviews = loadReviews();
      reviews.push({
        name: name,
        category: category,
        rating: rating,
        text: text,
        media: media,
        createdAt: new Date().toISOString(),
      });
      saveReviews(reviews);
      reviewForm.reset();
      if (reviewFormMsg) {
        reviewFormMsg.textContent = "Review posted. Thank you!";
      }
      renderReviews();
    });

    renderReviews();
  }

  // Inline videos in submitted reviews (data URLs): show a short note if playback fails.
  (function initVideoFallback() {
    var videos = document.querySelectorAll("video[src]");
    if (!videos || videos.length === 0) return;

    videos.forEach(function (video) {
      video.addEventListener("error", function () {
        var msg = document.createElement("p");
        msg.className = "video-fallback muted";
        msg.textContent = "This video could not be played in the browser.";
        video.replaceWith(msg);
      });
    });
  })();

  if (!nav || !toggle) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    if (header) header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) setOpen(false);
  });
})();
