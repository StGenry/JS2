function renderGoodsList() {
    $('#goods').empty();
    $.get('http://localhost:3000/goods', {}, function (goods) {
        var $ul = $('<ul />');
        goods.forEach(function (item) {
            $ul.append(
                $('<li />', {
                    text: item.name + ' ' + item.price + ' rub.'
                })
                    .append(
                        $('<button />', {
                            text: 'Buy',
                            'data-id': item.id,
                            'data-price': item.price,
                            'data-name': item.name
                        })
                    )
            )
        });
        $('#goods').append($ul);
    }, 'json');
}

function renderCart() {
    $('#cart').empty();
    $.get('http://localhost:3000/cart', {}, function (goods) {
        var $ul = $('<ul />');
        var total = 0;
        goods.forEach(function (item) {
            $ul.append(
                $('<li />', {
                    text: item.name + ' (' + item.quantity + ')'
                })
                    .append(
                        $('<button />', {
                            text: 'Remove',
                            'data-id': item.id,
                            'data-price': item.price,
                            'data-name': item.name,
                            'data-quantity': item.quantity
                        })
                    )
            );
            total += +item.quantity * +item.price;
        });
        $('#cart').append($ul);
        $('#cart').append($('<div />', {text: 'Total: ' + total + ' rub.'}))
    }, 'json');
}

(function ($) {
    $(document).ready(function () {
        renderGoodsList();
        renderCart();

        $('#cart').on('click', 'li button', function (event) {
            if ($(this).attr('data-quantity') > 1) {
                $.ajax({
                    type: 'PATCH',
                    url: 'http://localhost:3000/cart/' + $(this).attr('data-id'),
                    data: {quantity: +$(this).attr('data-quantity') - 1},
                    success: function () {
                        renderCart();
                    }
                });
            }
            else {
                $.ajax({
                    type: 'DELETE',
                    url: 'http://localhost:3000/cart/' + $(this).attr('data-id'),
                    success: function () {
                        renderCart();
                    }
                })
            }
        });

        $('#goods').on('click', 'li button', function (event) {
            var good = {
                id: $(this).attr('data-id'),
                price: $(this).attr('data-price'),
                name: $(this).attr('data-name'),
                quantity: 1
            }
            if ($('#cart li button[data-id="' + good.id + '"]').length) {
                var $good = $('#cart li button[data-id="' + good.id + '"]');

                $.ajax({
                    type: 'PATCH',
                    url: 'http://localhost:3000/cart/' + good.id,
                    data: {quantity: +$good.attr('data-quantity') + 1},
                    success: function () {
                        renderCart();
                    }
                });
            } else {
                $.ajax({
                    type: 'POST',
                    url: 'http://localhost:3000/cart',
                    data: good,
                    success: function () {
                        renderCart();
                    }
                });
            }
            event.preventDefault();
        })
    });
})(jQuery);