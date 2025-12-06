"use strict";

// Wrap everything
(function ($) {
  $(function () {
    console.log("Shoop main.js is running");

    // Tabs jquery
    $.fn.simpleTabs = function () {
      return this.each(function () {
        var $container = $(this);
        var $tabList = $container.children("ul");
        var $links = $tabList.find("a");
        var $panels = $container.children("section");

        if (!$links.length || !$panels.length) {
          return;
        }

        // roles
        $tabList.attr("role", "tablist");

        $links.each(function (index) {
          var $link = $(this);
          var panelId = $link.attr("href");
          if (panelId && panelId.charAt(0) === "#") {
            panelId = panelId.substring(1);
          }

          $link.attr({
            role: "tab",
            "aria-controls": panelId,
            "data-tab-index": index
          });
        });

        $panels.each(function (index) {
          $(this).attr({
            role: "tabpanel",
            "data-tab-index": index
          });
        });

        // all panels except first
        $panels.hide().attr("aria-hidden", "true");
        $panels.first().show().attr("aria-hidden", "false");

        $links.attr("aria-selected", "false").removeClass("is-active");
        $links.first().attr("aria-selected", "true").addClass("is-active");

        // switch tabs test 2
        $links.on("click", function (event) {
          event.preventDefault();
          var $clicked = $(this);
          var targetId = $clicked.attr("href");

          if (!targetId || targetId.charAt(0) !== "#") {
            return;
          }

          // update
          $links
            .removeClass("is-active")
            .attr("aria-selected", "false");
          $clicked
            .addClass("is-active")
            .attr("aria-selected", "true");

          // Show/hide panels
          $panels.hide().attr("aria-hidden", "true");
          $(targetId).show().attr("aria-hidden", "false");
        });
      });
    };

    // Initialize tabs on #game-tabs
    $("#game-tabs").simpleTabs();

    // slider
    (function setupCarousel() {
      var $carousel = $("#highlight-carousel");
      var $track = $carousel.find(".carousel-track");
      var $slides = $track.find(".carousel-slide");
      var $indicators = $carousel.find(".indicator");
      var slideCount = $slides.length;
      var currentIndex = 0;

      if (!slideCount) {
        return;
      }

      function goToSlide(index) {
        if (index < 0) {
          index = slideCount - 1;
        } else if (index >= slideCount) {
          index = 0;
        }

        currentIndex = index;
        var offsetPercent = -index * 100;
        $track.css("transform", "translateX(" + offsetPercent + "%)");

        $indicators.removeClass("is-active");
        $indicators.eq(index).addClass("is-active");
      }

      $carousel.find(".carousel-control.prev").on("click", function () {
        goToSlide(currentIndex - 1);
      });

      $carousel.find(".carousel-control.next").on("click", function () {
        goToSlide(currentIndex + 1);
      });

      $indicators.on("click", function () {
        var idx = parseInt($(this).attr("data-slide"), 10);
        if (!isNaN(idx)) {
          goToSlide(idx);
        }
      });

      // start on slide one
      goToSlide(0);
    })();

    // 3) day night and storage test# a billion holy cow
    (function setupThemeToggle() {
      var THEME_STORAGE_KEY = "shoopTheme";
      var $body = $("body");
      var $themeToggle = $("#theme-toggle");

      function applyTheme(theme) {
        if (theme === "night") {
          $body.removeClass("theme-day").addClass("theme-night");
          $themeToggle.attr("aria-pressed", "true");
          $themeToggle.find(".theme-toggle-icon").text("☀️");
          $themeToggle.find(".theme-toggle-text").text("Day mode");
        } else {
          $body.removeClass("theme-night").addClass("theme-day");
          $themeToggle.attr("aria-pressed", "false");
          $themeToggle.find(".theme-toggle-icon").text("🌙");
          $themeToggle.find(".theme-toggle-text").text("Night mode");
        }
      }

      // Load theme from localStorage
      var storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "night" || storedTheme === "day") {
        applyTheme(storedTheme);
      } else {
        applyTheme("day");
      }

      // Toggle on click
      $themeToggle.on("click", function () {
        var isNight = $body.hasClass("theme-night");
        var newTheme = isNight ? "day" : "night";
        applyTheme(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      });
    })();

    // 4) favorites test# a billion and one
    (function setupFavoritesStorage() {
      var PREFS_KEY = "shoopFavorites";
      var $favoritesForm = $("#favorites-form");

      function renderFavorites(prefs) {
        var name = prefs && prefs.name ? prefs.name : "friend";
        var game = prefs && prefs.game ? prefs.game : "great games";
        var vibe = prefs && prefs.vibe ? prefs.vibe : "cozy";

        $("#stored-name").text(name);
        $("#stored-game").text(game);
        $("#stored-vibe").text(vibe);
      }

      function loadFavorites() {
        try {
          var raw = localStorage.getItem(PREFS_KEY);
          if (!raw) {
            renderFavorites(null);
            return null;
          }

          var parsed = JSON.parse(raw) || {};
          // reflect into form
          if (parsed.name) {
            $("#fav-name").val(parsed.name);
          }
          if (parsed.game) {
            $("#fav-game").val(parsed.game);
          }
          if (parsed.vibe) {
            $("#fav-vibe").val(parsed.vibe);
          }

          renderFavorites(parsed);
          return parsed;
        } catch (err) {
          console.error("Error reading favorites from storage", err);
          renderFavorites(null);
          return null;
        }
      }

      loadFavorites();

      $favoritesForm.on("submit", function (event) {
        event.preventDefault();

        var prefs = {
          name: $("#fav-name").val().trim(),
          game: $("#fav-game").val().trim(),
          vibe: $("#fav-vibe").val()
        };

        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        renderFavorites(prefs);
      });

      $("#clear-storage").on("click", function () {
        localStorage.removeItem(PREFS_KEY);
        $("#fav-name").val("");
        $("#fav-game").val("");
        $("#fav-vibe").val("");
        renderFavorites(null);
      });
    })();

    // json
    (function setupRecommendations() {
      var RECS_URL = "data/recommendations.json";
      var allRecommendations = [];

      function renderRecommendations(items) {
        var $container = $("#recommendation-results");
        $container.empty();

        if (!items || !items.length) {
          $container.append(
            "<p>No recommendations found for that mood yet.</p>"
          );
          return;
        }

        items.forEach(function (item) {
          var $card = $("<article>", { "class": "rec-card" });

          $("<h3>").text(item.title).appendTo($card);

          if (item.platform) {
            $("<p>")
              .addClass("rec-platform")
              .text("Platform: " + item.platform)
              .appendTo($card);
          }

          if (item.description) {
            $("<p>")
              .addClass("rec-description")
              .text(item.description)
              .appendTo($card);
          }

          if (item.tagline) {
            $("<p>")
              .addClass("rec-tagline")
              .text(item.tagline)
              .appendTo($card);
          }

          if (item.steamUrl) {
            $("<a>")
              .attr({
                "href": item.steamUrl,
                "target": "_blank",
                "rel": "noopener noreferrer",
                "class": "btn rec-steam-link"
              })
              .text("View on Steam")
              .appendTo($card);
          }

          $container.append($card);
        });
      }

      function filterAndRender(genre) {
        var items = allRecommendations;

        if (genre && genre !== "all") {
          items = items.filter(function (item) {
            return item.genre === genre;
          });
        }

        renderRecommendations(items);
      }

      function loadRecommendations(genre) {
        // if never loaded fetch
        if (!allRecommendations.length) {
          $.getJSON(RECS_URL, function (data) {
            if (Array.isArray(data)) {
              allRecommendations = data;
            } else {
              allRecommendations = [];
            }
            filterAndRender(genre);
          }).fail(function () {
            $("#recommendation-results")
              .empty()
              .append(
                "<p>Sorry, recommendations could not be loaded right now.</p>"
              );
          });
        } else {
                  filterAndRender(genre);
        }
      }

      $("#recommendation-filter").on("submit", function (event) {
        event.preventDefault();
        var selectedGenre = $("#rec-genre").val();
        loadRecommendations(selectedGenre);
      });

     
      loadRecommendations("all");
    })();

    // Globe test #a trillion will give up after this
    (function setupCommunityMap() {
      var MAP_KEY = "shoopMapEntries";
      var PINS_URL = "data/community-pins.json";
      var $mapForm = $("#map-form");
      var $mapArea = $("#follower-map");
      var globeInstance = null;

      
      function geocodeLocation(locationString, callback) {
        var url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + 
                  encodeURIComponent(locationString);
        
        $.ajax({
          url: url,
          method: "GET",
          headers: {
            'User-Agent': 'ShoopGaming Community Map'
          },
          success: function(data) {
            if (data && data.length > 0) {
              callback({
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
              });
            } else {
              callback(null);
            }
          },
          error: function() {
            callback(null);
          }
        });
      }

      function loadStoredEntries() {
        try {
          var raw = localStorage.getItem(MAP_KEY);
          if (!raw) return [];
          var parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          console.error("Error reading map entries", err);
          return [];
        }
      }

      function saveEntries(entries) {
        localStorage.setItem(MAP_KEY, JSON.stringify(entries));
      }

      function initGlobe(allPins) {
  if (!window.Globe) {
    console.error("Globe.gl library not loaded");
    return;
  }

  // Clear any existing globe - bug fix
  $mapArea.empty();

  // Get theme colors - a nice to have
  var isDark = $("body").hasClass("theme-night");
  var atmosphereColor = isDark ? "#ff5757" : "#ff9a9a";

  // Get container dimensions - bug fix # 4
  var containerWidth = $mapArea.width();
  var containerHeight = $mapArea.height();

  globeInstance = Globe()
    ($mapArea[0])
    .width(containerWidth)
    .height(containerHeight)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .backgroundColor('rgba(0,0,0,0)')
    .atmosphereColor(atmosphereColor)
    .atmosphereAltitude(0.15)
    .pointsData(allPins)
    .pointAltitude(0.01)
    .pointRadius(0.4)
    .pointColor(function() { return '#ff5757'; })
    .pointLabel(function(d) {
      return '<div style="background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 8px; color: white;"><strong>' + d.name + '</strong><br/>' + d.location + '</div>';
    })
    .pointsMerge(true);

 
  globeInstance.controls().autoRotate = true;
  globeInstance.controls().autoRotateSpeed = 0.5;

 
  globeInstance.pointOfView({ altitude: 2.5 });
}

      function loadAndRenderMap() {
        // Load pins from JSON file
        $.getJSON(PINS_URL, function(jsonPins) {
          // Combine with locally stored pins
          var storedPins = loadStoredEntries();
          var allPins = jsonPins.concat(storedPins);
          
          initGlobe(allPins);
        }).fail(function() {
          // If JSON fails, just use stored pins, and also if this doens't work i'm going to cry
          var storedPins = loadStoredEntries();
          initGlobe(storedPins);
        });
      }

    
      loadAndRenderMap();

      // Handle form submission
      $mapForm.on("submit", function(event) {
        event.preventDefault();

        var name = $("#map-username").val().trim();
        var location = $("#map-location").val().trim();

        if (!location) {
          alert("Please enter a city or region!");
          return;
        }

        if (!name) {
          name = "Anonymous";
        }

        
        var $submitBtn = $mapForm.find('button[type="submit"]');
        var originalText = $submitBtn.text();
        $submitBtn.text("Adding pin...").prop("disabled", true);

       
        geocodeLocation(location, function(coords) {
          if (!coords) {
            alert("Sorry, couldn't find that location. Try being more specific (e.g., 'Austin, Texas')");
            $submitBtn.text(originalText).prop("disabled", false);
            return;
          }

          // Create new pin
          var newPin = {
            name: name,
            location: location,
            lat: coords.lat,
            lng: coords.lng
          };

          // Save to localStorage
          var stored = loadStoredEntries();
          stored.push(newPin);
          saveEntries(stored);

          // Reload the map
          loadAndRenderMap();

          // Clear form
          $("#map-username").val("");
          $("#map-location").val("");
          $submitBtn.text(originalText).prop("disabled", false);

        
          setTimeout(function() {
            if (globeInstance) {
              globeInstance.pointOfView({
                lat: coords.lat,
                lng: coords.lng,
                altitude: 1.5
              }, 2000);
            }
          }, 500);
        });
      });

     
      $("#theme-toggle").on("click", function() {
        setTimeout(function() {
          loadAndRenderMap();
        }, 100);
      });
    })();

    // 7) Footer year - holy moly, I'm done
    (function setFooterYear() {
      var yearSpan = document.getElementById("current-year");
      if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
      }
    })();
  });
})(jQuery);