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
            this.applyDiscountMiniCart();

            if(!this.doneOnce)
                this.doneOnce = true;
            this.bindEvents();
        }
    }

    DISCO.prototype.bindEvents = function(){

        if(this.isSearchPage){
            $(document).delegate(".results > ul", "DOMSubtreeModified", this.onChangeDiscountSearchPage.bind(this));
        }else if(this.isCategoryPage){
            $(document).delegate("div#items-wrapper", "DOMSubtreeModified", this.onChangeDiscountCategoryPage.bind(this));
        } else if(this.isCartPage) {
            $(document).delegate("#totalAmount", "DOMSubtreeModified", this.applyDiscountCartPage.bind(this));
        }
        $("#quickViewPopup .current-price").on("DOMSubtreeModified propertychange", this.applyDiscountQuickView.bind(this));
        $(".quickview-panel .current-price [data-bind*='currentPrice']").on("DOMSubtreeModified propertychange", this.applyDiscountQuickView.bind(this));
        $("#miniBasket .total").on("DOMSubtreeModified", this.applyDiscountMiniCart.bind(this));

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

        if (this.isProductPage) {
            this.priceContainer = $(".current-price");
            this.applyDiscountPDP();
        }else if(this.isSearchPage){
            this.priceContainer = $(".price-wrap.price-current");
            this.applyDiscountSearchPage();
        }else if(this.isCategoryPage){
            this.priceContainer = $("ul#items .productprice").length ? $("ul#items .productprice") : $(".price-wrap.price-current");
            this.applyDiscountCategoryPage();
        }else if(this.isCartPage){
            this.priceContainer = $("#totalAmount");
            this.applyDiscountCartPage();
        }else if(this.isSavedItemsPage){
            this.priceContainer = $("ul#sortable li");
            this.applyDiscountSavedItemPage();
        }

        this.applyDiscountYMAL();
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

    DISCO.prototype.applyDiscountYMAL = function(){
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

                current_price_dom = this.priceContainer.eq(i).find(".product-price");

                var price = parseFloat( current_price_dom.text().replace(this.currency, "").replace("NOW", "").replace("FROM", "")  );
                var after_price = (price * 0.6).toFixed(2);


                if(!isNaN(after_price)){
                    var inner_html = "<div class='disco-applied'>";
                    inner_html += "<p class='product-price-decrease'>"+ this.currency + price.toFixed(2) + "</p>";
                    inner_html += "<p class='product-price'>"+ this.currency + after_price + "</p>";
                    inner_html += "</div>";
                    current_price_dom.hide();
                    this.priceContainer.eq(i).find(".product-price, .product-price-decrease").hide();

                    this.priceContainer.eq(i).find('.expiry-datestamp').after("<span class='expiry-datestamp' style='margin-right:5px;float:left;'>ASOS Staff price</span>");
                    current_price_dom.after(inner_html);
                }
            }
        }
    }

    DISCO.prototype.applyDiscountCartPage = function(){
        //Basket
        this.fetchCurrency(0);
        var current_price_dom = this.priceContainer.eq(0);
        var price = parseFloat( current_price_dom.text().replace(this.currency, "")  );
        var after_price = (price * 0.6).toFixed(2);

        if(!isNaN(after_price)){
            var inner_html = "<span style='color:#900;'>"+ this.currency + after_price + "</span>";
            current_price_dom.hide();
            current_price_dom.after(inner_html);

            $("dt.total")[0].innerHTML = "Total Cost with ASOS discount";
            $("dd.total").after("<dt class='you-save total' style='border-top:0px;color: green;margin:0;padding:0;'>You Save</dt>");
            $("dt.you-save").after("<dd class='total' style='border-top:0px;color: green;margin:0;padding:0;'><span style='padding-right:14px;'>" + ( this.currency + (price - after_price).toFixed(2) ) + "</span></dd>")
        }
    }

    DISCO.prototype.applyDiscountMiniCart = function(){
        //Mini Cart

        this.fetchCurrency(0);
        var current_price_dom = $("#miniBasket .total");
        var price = parseFloat( current_price_dom.text().replace(this.currency, "")  );
        var after_price = (price * 0.6).toFixed(2);

        if(!this.doneOnce){
            current_price_dom.before("<span class='asos-mini-disco'> with ASOS discount</span>");
            this.miniCartTotal = price;
        }


        if(!isNaN(price) && (price != this.miniCartTotal || !this.doneOnce) ){
            //console.log("price", price);
            current_price_dom.next(".new-total").remove();
            current_price_dom.after("<span class='new-total' style='margin-left:7px;'>" + this.currency + after_price + "</span>");
            current_price_dom.hide();
            this.miniCartTotal = after_price;
        }

    }

    new DISCO();
})();
