(function(){
    var DISCO = function(){

        this.isProductPage;
        this.isCategoryPage;
        this.isSearchPage;
        this.isCartPage;
        this.isSavedItemsPage;
        this.isBeautyProduct;
        this.Gender;
        this.isEnabled;
        this.miniCartTotal;

        this.location;
        this.priceContainer;
        this.currency ;
        this.dfd = jQuery.Deferred();
        this.doneOnce = false;

        this.dfd.promise(this)
        this.done(this.continueLoading.bind(this));

        this.getStatus();
    };


    DISCO.prototype.getStatus = function(){
        chrome.runtime.sendMessage( {method: "getLocalStorage", key: "asos_disco"}, this.setStatus.bind(this) );
    }

    DISCO.prototype.setStatus = function(response){
        this.isEnabled = ( response.data === "true" || typeof(response.data) === "undefined" );
        this.dfd.resolve( "done" );
    }

    DISCO.prototype.continueLoading = function(){
        if(this.isEnabled){
            this.fetchPageType();
            this.selectItems();

            if(!this.doneOnce)
                this.doneOnce = true;
            this.bindEvents();
        }
    }

    DISCO.prototype.bindEvents = function(){

      var _this = this;

      setTimeout((function() {
        if(_this.isSearchPage){
            $(document).delegate(".results > ul", "DOMSubtreeModified", _this.onChangeDiscountSearchPage.bind(_this));
        }else if(_this.isCategoryPage){
            $(document).delegate("div#items-wrapper", "DOMSubtreeModified", _this.onChangeDiscountCategoryPage.bind(_this));
        } else if(_this.isCartPage) {
            $(document).on('click','button.bag-item-edit-update', _this.applyDiscountCartPageUpdate.bind(_this));
        }

        $("#quickViewPopup .current-price").on("DOMSubtreeModified propertychange", _this.applyDiscountQuickView.bind(_this));
        $(".quickview-panel .current-price").on("DOMSubtreeModified propertychange", _this.applyDiscountQuickView.bind(_this));
        $('#miniBagApp .bag-link-price').on("DOMSubtreeModified propertychange", _this.applyDiscountMiniCart.bind(_this));
        $('.bag-link.bag-link--desktop').mouseover(_this.applyDiscountMiniCartUpdate.bind(_this));
        $('.component.might-like .arrow.active, .component.might-like ul.nav li a').on('click', _this.applyDiscountYMAL.bind(_this))
        _this.applyDiscountMiniCart();
      }),2000);

    }

    DISCO.prototype.fetchPageType = function(){
        this.location = window.location.href.toLowerCase();

        this.isBeautyProduct = this.detectBeautyPage();
        this.Gender = this.detectPageGender();
        this.isProductPage = this.location.indexOf("/prd/") > -1 || this.location.indexOf("/grp/") > -1;
        this.isCategoryPage = this.location.indexOf("/men/") > -1 || this.location.indexOf("/women/") > -1 || this.location.indexOf("/pgecategory.aspx") > -1;
        this.isSearchPage = $(".results > ul").length > 0;
        this.isCartPage = $('#bagApp').length > 0;
        this.isSavedItemsPage = $('#savedItemsApp').length > 0;
    }

    DISCO.prototype.detectBeautyPage = function(){
        var isBeauty = false;

        if(this.location.indexOf("/beauty/") > -1){
            isBeauty = true;
        }else if(document.getElementById("CategoryName")){
            isBeauty = document.getElementById("CategoryName").value.toLowerCase() == "beauty";
        }

        return isBeauty;
    }

    DISCO.prototype.detectPageGender = function(){
        var isWomen = "";

        if(this.location.indexOf("/women/") > -1){
            isWomen = "women";
        }else if(document.getElementById("FloorName")){
            isWomen = document.getElementById("FloorName").value.toLowerCase();
        }

        return isWomen;
    }

    DISCO.prototype.isDiscountApplied = function(){
        return this.priceContainer.find(".disco-applied").length;
    }

    DISCO.prototype.selectItems = function(){
        var _this = this;

        setTimeout((function() {
          if (_this.isProductPage) {
              _this.priceContainer = $(".current-price");
              _this.applyDiscountPDP();
          }else if(_this.isSearchPage){
              _this.priceContainer = $(".price-wrap.price-current");
              _this.applyDiscountSearchPage();
          }else if(_this.isCategoryPage){
              _this.priceContainer = $("ul#items .productprice").length ? $("ul#items .productprice") : $(".price-wrap.price-current");
              _this.applyDiscountCategoryPage();
          }else if(_this.isCartPage){
              _this.applyDiscountCartPage();
          }else if(_this.isSavedItemsPage){
              _this.priceContainer = $("ul.savedItems-items li");
              _this.applyDiscountSavedItemPage();
          }

          _this.applyDiscountYMAL();
        }),1500);
    };

    DISCO.prototype.fetchCurrency = function(i){
        if(this.priceContainer) {
            var pricetext = this.priceContainer.eq(i).text();

            if(pricetext.indexOf("£") != -1){
                this.currency = "£";
            }else if(pricetext.indexOf("$") != -1){
                this.currency = "$";
            }else if(pricetext.indexOf("€") != -1){
                this.currency = "€";
            }else if(pricetext.indexOf("руб.") != -1){
                this.currency = "руб.";
            }
        }
    }

    DISCO.prototype.detectCurrency = function(price){
        if(price) {
            var pricetext = price;
            var currency;

            if(pricetext.indexOf("£") != -1){
                currency = "£";
            }else if(pricetext.indexOf("$") != -1){
                currency = "$";
            }else if(pricetext.indexOf("€") != -1){
                currency = "€";
            }else if(pricetext.indexOf("руб.") != -1){
                currency = "руб.";
            }

            return currency;
        }
    }

    DISCO.prototype.applyDiscountYMAL = function(){
      var _this = this;
      $('.component.might-like .price-container:not(".asos-staff")').each(function(){
        var price = $(this).find('.price').text();
        var currency = _this.detectCurrency(price);
        var disocuntedPrice = (parseFloat($(this).find('.price').text().replace(currency, '')) * 0.6).toFixed(2);

        if(!isNaN(disocuntedPrice)){
          $(this).addClass('asos-staff');
          $(this).find('.price').css('text-decoration', 'line-through');
          $(this).find('.price').after('<div style="float:left;"><span style="font-size:14px">ASOS STAFF</span>' + currency + disocuntedPrice + '</div>');
        }
      });
    }

    DISCO.prototype.applyDiscountPDP = function(){
        //Product Page
        var discountFactor = ((this.Gender == "women") && this.isBeautyProduct) ? 0.8 : 0.6;

        if(typeof(this.priceContainer) !== "undefined"){

            for(var i = (this.priceContainer.length - 1); i >= 0; i--){
                this.fetchCurrency(i);
                var current_price_dom = this.priceContainer.eq(i);
                if(!current_price_dom.find(".disco-applied").length){
                    $('.asos-product .product-hero span').css('float', 'none');
                    var price = parseFloat( current_price_dom.text().replace(this.currency, "")  );
                    var after_price = (price * discountFactor).toFixed(2);

                    if(!isNaN(after_price)){
                        var inner_html = "<div class='disco-applied' style='margin: 10px -10px 10px;padding: 10px;background: #fffbbf;color: #000 !important;font-weight: 400;'>";
                        inner_html += "<div style=''>with ASOS discount</div>" + "<div style='font-weight:700;'>"+ this.currency + after_price + "</div>";
                        inner_html += "<div style='font-size:14px;'>You save</div>" + "<div style='font-weight: 700;font-size:14px;'>"+ this.currency + (price - after_price).toFixed(2) + "!</div>";
                        inner_html += "</div>";

                        //current_price_dom.hide();
                        //$(".discounted-price").hide();
                        //current_price_dom.hide();

                        //current_price_dom.css("color", "#000");
                        current_price_dom.after(inner_html);
                    }
                }
            }
        }
    }

    DISCO.prototype.applyDiscountQuickView = function(){
        //Quick View
        var discountFactor = ((this.Gender == "women") && this.isBeautyProduct) ? 0.8 : 0.6;

        if(typeof(this.priceContainer) !== "undefined"){
            this.priceContainer = $(".quickview-panel .current-price").length ? $(".quickview-panel .current-price") : $("#quickViewPopup .current-price");
            $(".disco-applied.quick-view").remove();
            for(var i = (this.priceContainer.length - 1); i >= 0; i--){
                this.fetchCurrency(i);
                var current_price_dom = this.priceContainer.eq(i);
                var price = parseFloat( current_price_dom.text().replace(this.currency, "").replace("NOW", "").replace("FROM", "")  );
                var after_price = (price * discountFactor).toFixed(2);

                if(!isNaN(after_price)){
                    var inner_html = "<div class='disco-applied quick-view' style='margin: 10px -10px 10px;padding: 10px;background: #fffbbf;color: #000 !important;font-weight: 400;'>";
                    inner_html += "<div style='margin:0 5px 5px 0px;padding:0;height:16px;line-height: 16px;font-size:0.85em;'>with ASOS discount</div>" + "<div style='font-weight:700;font-size:0.85em;margin:0 5px 5px 0px;padding:0;height:16px;line-height: 16px;'>"+ this.currency + after_price + "</div>";
                    inner_html += "<div style='font-size:13px;margin:0 5px 3px 0px;padding:0;height:16px;line-height: 16px;'>You save</div>" + "<div style='font-size:13px;font-weight:700;margin:0 5px 5px 0px;padding:0;height:16px;line-height: 16px;'>"+ this.currency + (price - after_price).toFixed(2) + "!</div>";
                    inner_html += "</div>";

                    $("#quickViewPopup .previous-price span, .quickview-panel .previous-price").hide();
                    $('#quickViewPopup .previous-price span, .quickview-panel .previous-price').css('color', '#fff');

                    current_price_dom.css('float', 'none');
                    current_price_dom.after(inner_html);
                }
            }
        }
    }

    DISCO.prototype.onChangeDiscountCategoryPage = function(){
        this.priceContainer = $("ul#items .productprice");
        this.applyDiscountCategoryPage();
    }

    DISCO.prototype.applyDiscountCategoryPage = function(){
        //Category
        var discountFactor = ((this.Gender == "women") && this.isBeautyProduct) ? 0.8 : 0.6;

        if(!this.isDiscountApplied() && typeof(this.priceContainer) !== "undefined"){

            for(var i = (this.priceContainer.length - 1); i >= 0; i--){
                this.fetchCurrency(i);
                if(!this.priceContainer.eq(i).find(".disco-applied").length){
                    var current_price_dom = undefined;

                    if(this.priceContainer.eq(i).find(".outlet-current-price").length){
                        current_price_dom = this.priceContainer.eq(i).find(".outlet-current-price");
                    } else if(this.priceContainer.eq(i).find(".previousprice").text().length){
                        current_price_dom = this.priceContainer.eq(i).find(".previousprice");
                    } else {
                        current_price_dom = this.priceContainer.eq(i).find(".price");
                    }

                    var price = parseFloat( current_price_dom.text().replace(this.currency, "").replace("NOW", "").replace("FROM", "")  );
                    var after_price = (price * discountFactor).toFixed(2);

                    if(!isNaN(after_price)){
                        var inner_html = "<div class='disco-applied'>";
                        inner_html += "<div>ASOS Staff price</div>";
                        inner_html += "<span style='color:black;'>WAS </span>" + "<span style='color:black;'>"+ this.currency + price.toFixed(2) + "</span>";
                        inner_html += "<span style='color:#900;'> NOW </span>" + "<span style='color:#900;'>"+ this.currency + after_price + "</span>";
                        inner_html += "</div>";
                        current_price_dom.hide();
                        this.priceContainer.eq(i).find(".rrp, .prevPrice, .previousprice, .disco-applied").hide();

                        current_price_dom.after(inner_html);
                    }
                }
            }
        }
    }

    DISCO.prototype.onChangeDiscountSearchPage = function(){
        this.priceContainer = $(".price-wrap.price-current");
        this.applyDiscountSearchPage();
    }

    DISCO.prototype.applyDiscountSearchPage = function(){
        //Search Results

        if(typeof(this.priceContainer) !== "undefined"){

            for(var i = (this.priceContainer.length - 1); i >= 0; i--){
                this.fetchCurrency(i);

                if(!this.priceContainer.eq(i).find(".disco-applied").length){
                    var current_price_dom = undefined;

                    if(this.priceContainer.eq(i).find(".outlet-current-price").length){
                        current_price_dom = this.priceContainer.eq(i).find(".outlet-current-price");
                    } else if(this.priceContainer.eq(i).find(".previousprice").text().length){
                        current_price_dom = this.priceContainer.eq(i).find(".previousprice");
                    } else {
                        current_price_dom = this.priceContainer.eq(i).find(".price");
                    }

                    var price = parseFloat( current_price_dom.text().replace(this.currency, "").replace("NOW", "").replace("FROM", "")  );
                    var after_price = (price * 0.6).toFixed(2);

                    if(!isNaN(after_price)){
                        var inner_html = "<div class='disco-applied'>";
                        inner_html += "<div>ASOS Staff price</div>";
                        inner_html += "<span style='color:black;'>WAS </span>" + "<span style='color:black;'>"+ this.currency + price.toFixed(2) + "</span>";
                        inner_html += "<span style='color:#900;'> NOW </span>" + "<span style='color:#900;'>"+ this.currency + after_price + "</span>";
                        inner_html += "</div>";
                        current_price_dom.hide();
                        this.priceContainer.eq(i).find(".rrp, .prevPrice, .previousprice, .disco-applied").hide();

                        current_price_dom.after(inner_html);
                    }

                }
            }
        }
    }

    DISCO.prototype.applyDiscountSavedItemPage = function(){
        //Saved Item
        if(!this.isDiscountApplied() && typeof(this.priceContainer) !== "undefined"){

            for(var i = (this.priceContainer.length - 1); i >= 0; i--){
                this.fetchCurrency(i);
                var current_price_dom = undefined;

                current_price_dom = this.priceContainer.eq(i).find(".savedItems-item-price--current");

                var price = parseFloat( current_price_dom.text().replace(this.currency, "").replace("NOW", "").replace("FROM", "")  );
                var after_price = (price * 0.6).toFixed(2);


                if(!isNaN(after_price)){
                    var inner_html = "<span style='font-size:13px;font-weight:700;display:block;margin: 5px -5px 5px;padding:5px 7px;background: #fffbbf;' class='disco-applied'>ASOS STAFF " + this.currency + after_price + "</span>";
                    //current_price_dom.hide();
                    this.priceContainer.eq(i).find(".product-price, .product-price-decrease").hide();

                    this.priceContainer.eq(i).find('.expiry-datestamp').after("<span class='expiry-datestamp' style='margin-right:5px;float:left;'>ASOS Staff price</span>");
                    current_price_dom.after(inner_html);
                }
            }

            $('.savedItems-item-holder').height('600px')
        }
    }

    DISCO.prototype.applyDiscountCartPage = function(){
        //Basket
        var _this = this;

        $('.asos-discount-price-0, .asos-discount-price-1, .asos-discount-price, .asos-save-price-1, .asos-save-price').remove();
        $('.bag-item-descriptions .bag-item-price-holder').each(function(){
          var price = $(this).find('.bag-item-price--current').text();
          var currency = _this.detectCurrency(price);
          var disocuntedPrice = (parseFloat(price.replace(currency, '')) * 0.6).toFixed(2);

          if(!isNaN(disocuntedPrice)){
            $(this).addClass('asos-staff');
            $(this).find('.bag-item-price--current').after('<div class="asos-discount-price-0" style="font-size: 13px;font-weight:700;margin: 10px -7px 5px;padding: 7px;background: #fffbbf;">ASOS STAFF ' + currency + disocuntedPrice + '</div>');
          }
        });

        $(".bag-total-price.bag-total-price--subtotal").each(function(){
          var price = $(this).text();
          var currency = _this.detectCurrency(price);
          var disocuntedPrice = (parseFloat(price.replace(currency, '')) * 0.6).toFixed(2);
          var saveAmount = (parseFloat(price.replace(currency, '')) * 0.4).toFixed(2);
          if(!isNaN(disocuntedPrice)){
            $(this).addClass('asos-staff');
            $(this).after('<div class="asos-discount-price" style="font-size: 13px;font-weight:700;margin: 14px -7px 0;padding: 7px;background: rgb(231,243,246);">Discounted Sub-total <span style="font-weight:400;float:right;">' + currency + disocuntedPrice + '<span></div>');
            $('.asos-discount-price').after('<div class="asos-save-price" style="font-size: 13px;font-weight:700;margin: 10px -7px 0;padding: 7px;background: #fffbbf;">Saving tot. <span style="font-weight:400;float:right;">' + currency + saveAmount + '<span></div>');
          }
        });

        var price = $('.bag-subtotal-price').text();
        var currency = this.detectCurrency(price);
        var disocuntedPrice = (parseFloat(price.replace(currency, '')) * 0.6).toFixed(2);
        var saveAmount = (parseFloat(price.replace(currency, '')) * 0.4).toFixed(2);
        if(!isNaN(disocuntedPrice)){
          $('.bag-subtotal-price').addClass('asos-staff');
          $('.bag-subtotal-price').after('<div class="asos-discount-price-1" style="font-size: 13px;font-weight:700;margin: 14px -7px 0;padding: 7px;background: rgb(231,243,246);">Discounted Sub-total <span style="font-weight:700;float:right;min-width:95px;">' + currency + disocuntedPrice + '<span></div>');
          $('.asos-discount-price-1').after('<div class="asos-save-price-1" style="font-size: 13px;font-weight:700;margin: 10px -7px 0;padding: 7px;background: #fffbbf;">Saving tot.<span style="font-weight:700;float:right;min-width:95px;">' + currency + saveAmount + '<span></div>');
        }
        $('.bag-item-remove').css('top', '20px')
    }

    DISCO.prototype.applyDiscountMiniCart = function(){
        //Mini Cart
        var price = $('#miniBagApp .bag-link-price').text();
        var currency = this.detectCurrency(price);
        var disocuntedPrice = (parseFloat(price.replace(currency, '')) * 0.6).toFixed(2);
        if(!isNaN(disocuntedPrice)){
          $('#miniBagApp .bag-link-price').text(' with staff discount ' + currency + disocuntedPrice);
          $('#miniBagApp .bag-link-price').addClass('first-load');
          this.applyDiscountMiniCartUpdate();
        }
    }

    DISCO.prototype.applyDiscountCartPageUpdate = function(){
      var _this = this;
      setTimeout(function(){
        _this.applyDiscountCartPage();
      }, 1000);
    };

    DISCO.prototype.applyDiscountMiniCartUpdate = function(){
        //Mini Cart
        var _this = this;
        setTimeout(function(){
          var price = $('#miniBagApp .minibag-subtotal-price').text();
          var currency = _this.detectCurrency(price);
          var disocuntedPrice = (parseFloat(price.replace(currency, '')) * 0.6).toFixed(2);
          $('#miniBagApp .asos-mini-discount-price').remove();
          if(!isNaN(disocuntedPrice)){
            $('#miniBagApp .minibag-subtotal-holder').after('<div class="asos-mini-discount-price" style="font-size: 13px;font-weight:400;margin-bottom:10px;font-family:Tahoma,Arial,sans-serif;padding: 10px 0;background: #fffbbf;text-align:left;padding-left:18px;">Discounted Sub-total <span style="font-weight:400;float:right;min-width:55px;padding-right:10px;">' + currency + disocuntedPrice + '<span></div>');
          }
        }, 1000);
    }

    new DISCO();
})();
