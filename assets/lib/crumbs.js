
// ############### DROPDOWN ###############
document.addEventListener('DOMContentLoaded', function () {
    
    // 1. Ambil semua elemen dengan class .dropdown-toggle
    const dropdownToggles = document.querySelectorAll('.cr-drop-toggle');

    if (!dropdownToggles) return;

    dropdownToggles.forEach((toggle) => {
        toggle.addEventListener('click', function (e) {
            e.preventDefault(); // Mencegah perilaku default (misal jika tag <a>)
            e.stopPropagation(); // Mencegah event bubbling ke window (agar tidak langsung tertutup)

            // Cari elemen menu (dropdown-menu) yang bersaudara dengan tombol ini
            // Kita cari parent terdekat (.dropdown), lalu cari .dropdown-menu di dalamnya
            const parent = this.closest('.cr-dropdown'); 
            const menu = parent.querySelector('.cr-drop-menu');

            // Opsional: Tutup semua dropdown LAIN yang sedang terbuka (perilaku asli Bootstrap)
            closeAllDropdowns(menu);

            // Toggle class 'show' pada menu milik tombol ini saja
            menu.classList.toggle('show');
        });
    });

    // 2. Event Listener pada Window untuk menutup dropdown saat klik di luar
    window.addEventListener('click', function () {
        closeAllDropdowns(null);
    });

    // Helper function untuk menutup dropdown
    function closeAllDropdowns(exceptMenu) {
        const allMenus = document.querySelectorAll('.cr-drop-menu');
        allMenus.forEach((menu) => {
            // Jika menu ini bukan menu yang sedang kita klik, maka tutup
            if (menu !== exceptMenu) {
                menu.classList.remove('show');
            }
        });
    }
});


// ############### CAROUSEL ###############
class CustomCarousel {
  constructor(carousel) {
    this.carousel = carousel;
    this.slides = carousel.querySelectorAll(".carousel-slide");
    this.prevBtn = carousel.querySelector("[data-prev]");
    this.nextBtn = carousel.querySelector("[data-next]");
    this.indicatorsContainer = carousel.querySelector("[data-indicators]");

    this.currentIndex = 0;
    this.interval = null;

    this.isAuto = carousel.dataset.auto === "true";
    this.duration = Number(carousel.dataset.duration) || 3000;

    // Default false
    this.useThumbnailIndicator = carousel.dataset.indicatorThumbnail === "true";
    this.showLightboxInfo = carousel.dataset.lightboxInfo !== "false";

    this.init();
  }

  init() {
    this.createIndicators();
    this.updateCarousel();
    this.createLightbox();
    
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => {
        this.prevSlide();
        this.scrollActiveIndicator();
        this.restartAutoSlide();
      });
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => {
        this.nextSlide();
        this.scrollActiveIndicator();
        this.restartAutoSlide();
      });
    }
    
    if (this.isAuto) {
      this.startAutoSlide();
    }

    this.carousel.addEventListener("click", (event) => {
      if (event.target.closest(".carousel-btn, .carousel-indicator")) return;

      const slide = event.target.closest(".carousel-slide");
      if (slide) {
        this.openLightbox(slide);
      }
    });
  }

  createIndicators() {
    if (!this.indicatorsContainer) return;

    this.indicatorsContainer.innerHTML = "";

    this.indicatorsContainer.classList.toggle(
      "thumbnail-mode",
      this.useThumbnailIndicator
    );

    this.slides.forEach((slide, index) => {
      const indicator = document.createElement("div");

      indicator.classList.add("carousel-indicator");

      if (this.useThumbnailIndicator) {
        const slideImage = slide.querySelector("img");

        if (slideImage) {
          const thumbnailImage = document.createElement("img");

          thumbnailImage.src = slideImage.getAttribute("src");
          thumbnailImage.alt =
            slideImage.getAttribute("alt") || `Slide ${index + 1}`;

          indicator.appendChild(thumbnailImage);
        }
      }

      indicator.addEventListener("click", () => {
        this.goToSlide(index);
        this.scrollActiveIndicator();
        this.restartAutoSlide();
      });

      this.indicatorsContainer.appendChild(indicator);
    });

    this.indicators = this.indicatorsContainer.querySelectorAll(
      ".carousel-indicator"
    );
  }

  updateCarousel() {
    this.slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === this.currentIndex);
    });

    if (this.indicators) {
      this.indicators.forEach((indicator, index) => {
        indicator.classList.toggle("active", index === this.currentIndex);
      });
    }
  }

  scrollActiveIndicator() {
    if (!this.useThumbnailIndicator) return;
    if (!this.indicatorsContainer || !this.indicators) return;

    const activeIndicator = this.indicators[this.currentIndex];

    if (!activeIndicator) return;

    const containerWidth = this.indicatorsContainer.offsetWidth;
    const indicatorLeft = activeIndicator.offsetLeft;
    const indicatorWidth = activeIndicator.offsetWidth;

    const scrollPosition =
      indicatorLeft - containerWidth / 2 + indicatorWidth / 2;

    this.indicatorsContainer.scrollTo({
      left: scrollPosition,
      behavior: "smooth"
    });
  }

  goToSlide(index) {
    this.currentIndex = index;
    this.updateCarousel();
  }

  nextSlide() {
    this.currentIndex++;

    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = 0;
    }

    this.updateCarousel();
  }

  prevSlide() {
    this.currentIndex--;

    if (this.currentIndex < 0) {
      this.currentIndex = this.slides.length - 1;
    }

    this.updateCarousel();
  }

  startAutoSlide() {
    this.stopAutoSlide();

    this.interval = setInterval(() => {
      this.nextSlide();
    }, this.duration);
  }

  stopAutoSlide() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  restartAutoSlide() {
    if (this.isAuto) {
      this.startAutoSlide();
    }
  }

  createLightbox() {
    this.lightbox = document.createElement("div");
    this.lightbox.classList.add("carousel-lightbox");

    this.lightbox.innerHTML = `
      <div class="carousel-lightbox-content">
        <button class="carousel-lightbox-close" type="button" aria-label="Close">&times;</button>

        <div class="carousel-lightbox-wrap-img">
          <button class="carousel-lightbox-nav carousel-lightbox-prev" type="button" aria-label="Previous image">&#10094;</button>

          <button class="carousel-lightbox-nav carousel-lightbox-next" type="button" aria-label="Next image">&#10095;</button>

          <img class="carousel-lightbox-img" src="" alt="">
        </div>

        <div class="carousel-lightbox-info">
          <h3 class="carousel-lightbox-title"></h3>
          <p class="carousel-lightbox-desc"></p>
        </div>
      </div>
    `;

    document.body.appendChild(this.lightbox);

    this.lightboxImg = this.lightbox.querySelector(".carousel-lightbox-img");
    this.lightboxInfo = this.lightbox.querySelector(".carousel-lightbox-info");
    this.lightboxTitle = this.lightbox.querySelector(".carousel-lightbox-title");
    this.lightboxDesc = this.lightbox.querySelector(".carousel-lightbox-desc");
    this.lightboxClose = this.lightbox.querySelector(".carousel-lightbox-close");
    this.lightboxPrev = this.lightbox.querySelector(".carousel-lightbox-prev");
    this.lightboxNext = this.lightbox.querySelector(".carousel-lightbox-next");

    if (!this.showLightboxInfo && this.lightboxInfo) {
      this.lightboxInfo.hidden = true;
    }

    this.lightboxClose.addEventListener("click", () => {
      this.closeLightbox();
    });

    this.lightboxPrev.addEventListener("click", () => {
      this.prevLightboxSlide();
    });

    this.lightboxNext.addEventListener("click", () => {
      this.nextLightboxSlide();
    });

    this.lightbox.addEventListener("click", (event) => {
      if (event.target === this.lightbox) {
        this.closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!this.lightbox.classList.contains("active")) return;

      if (event.key === "Escape") {
        this.closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        this.prevLightboxSlide();
      }

      if (event.key === "ArrowRight") {
        this.nextLightboxSlide();
      }
    });

    if (this.slides.length <= 1) {
      this.lightboxPrev.style.display = "none";
      this.lightboxNext.style.display = "none";
    }
  }

  openLightbox(slide) {
    const slideIndex = Array.from(this.slides).indexOf(slide);

    if (slideIndex === -1) return;

    this.lightboxIndex = slideIndex;

    this.showLightboxSlide(this.lightboxIndex);

    this.lightbox.classList.add("active");
    document.body.style.overflow = "hidden";

    this.stopAutoSlide();
  }

  showLightboxSlide(index) {
    const slide = this.slides[index];

    if (!slide) return;

    const image = slide.querySelector("img");

    if (!image) return;

    const imageSrc = image.currentSrc || image.getAttribute("src");
    const imageAlt = image.getAttribute("alt") || "";

    const title = slide.dataset.title || imageAlt || "Image Detail";
    const description = slide.dataset.description || "";

    this.lightboxImg.src = imageSrc;
    this.lightboxImg.alt = imageAlt;

    if (this.showLightboxInfo) {
      this.lightboxTitle.textContent = title;
      this.lightboxDesc.textContent = description;
    }

    this.currentIndex = index;
    this.updateCarousel();

    if (this.useThumbnailIndicator) {
      this.scrollActiveIndicator();
    }
  }

  nextLightboxSlide() {
    this.lightboxIndex++;

    if (this.lightboxIndex >= this.slides.length) {
      this.lightboxIndex = 0;
    }

    this.showLightboxSlide(this.lightboxIndex);
  }

  prevLightboxSlide() {
    this.lightboxIndex--;

    if (this.lightboxIndex < 0) {
      this.lightboxIndex = this.slides.length - 1;
    }

    this.showLightboxSlide(this.lightboxIndex);
  }

  closeLightbox() {
    this.lightbox.classList.remove("active");
    document.body.style.overflow = "";

    this.lightboxImg.src = "";

    this.restartAutoSlide();
  }
}

function initCrumbCarousels(root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  const carousels = [
    ...(scope instanceof Element && scope.matches("[data-carousel]") ? [scope] : []),
    ...scope.querySelectorAll("[data-carousel]")
  ];

  carousels.forEach((carousel) => {
    if (carousel.dataset.carouselInitialized === "true") return;

    carousel.dataset.carouselInitialized = "true";
    carousel.crCarousel = new CustomCarousel(carousel);
  });
}

window.initCrumbCarousels = initCrumbCarousels;

document.addEventListener("DOMContentLoaded", () => {
  initCrumbCarousels();
});
