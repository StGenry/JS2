"use strict";

/*
 * ** - При нажатии на кнопку «Отправить» произвести валидацию полей следующим образом:
 * - Имя содержит только буквы;
 * ** - Телефон подчиняется шаблону +7(000)000-0000;**
 * ** - E-mail выглядит как mymail@mail.ru, или my.mail@mail.ru, или my-mail@mail.ru**
 * ** - Текст произвольный;**
 * (!) отошел от задания, вместо произвольного текста, проверка пароля на наличие заглавной буквы, строчной буквы и цифры
 *  и проверки по длине
 * ** - В случае не прохождения валидации одним из полей необходимо выделять это поле красной рамкой
 * и сообщать пользователю об ошибке.**
 * */

/**
 * Объект содержащий методы для валидации.
 */
const validationMethods = {
    /**
     * Метод проверки поля по длине.
     * @param {HTMLInputElement} field Поле, которое надо проверить.
     * @param {Array} args Массив с аргументами.
     * @returns {string|null} Строку с ошибкой или null, если ошибки не было.
     */
    length(field, args) {
        // Получаем длину текста в поле.
        const valLength = field.value.length,
            sign = args[0],
            then = args[1];

        // Перебираем знак и если сравнение не сработает, записываем ошибку.
        let message = null;
        switch (sign) {
            case '>':
                if (!(valLength > then)) {
                    message = `Минимальная длина поля: ${then + 1}.`;
                }
                break;
            case '<':
                if (!(valLength < then)) {
                    message = `Максимальная длина поля: ${then - 1}.`;
                }
                break;
            case '>=':
                if (!(valLength >= then)) {
                    message = `Минимальная длина поля: ${then}.`;
                }
                break;
            case '<=':
                if (!(valLength <= then)) {
                    message = `Максимальная длина поля: ${then}.`;
                }
                break;
            case '==':
                if (valLength !== then) {
                    message = `Длина поля должна равняться: ${then} символам.`;
                }
                break;
        }

        // Возвращаем ошибку.
        return message;
    },

    /**
     * Проверяет содержит ли поле только цифры.
     * @param {HTMLInputElement} field Поле, которое надо проверить.
     * @returns {string|null} Строку с ошибкой или null, если ошибки не было.
     */
    mustContainNumbers(field) {
        return /^\d+$/.test(field.value) ? null : 'Поле должно содержать только буквы';
    },


    /**
     * Проверяет содержит ли поле только буквы.
     * @param {HTMLInputElement} field Поле, которое надо проверить.
     * @returns {string|null} Строку с ошибкой или null, если ошибки не было.
     */
    mustContainLetters(field) {
        // Если ошибок не было отправляем null.
        return /^[а-яА-Яa-zA-ZёЁ]+$/.test(field.value) ? null : 'Поле должно содержать только буквы';
    },

    /**
     * Проверяет удовлетворять ли  шаблону.
     * @param {HTMLInputElement} field Поле, которое надо проверить.
     * @param {Array} args Массив с аргументами.
     * @returns {string|null} Строку с ошибкой или null, если ошибки не было.
     */
    inTemplate(field, args) {
        // Если ошибок не было отправляем null.
        //return args[1].test(field.value) ? null : `Поле должно удовлетворять шаблону ${args[0]}.`; // не катит для JSON
        return (new RegExp(args[1], 'i')).test(field.value) ? null : `Поле должно удовлетворять шаблону: ${args[0]}.`;
    },

    /**
     * Проверяет совпадают ли у двух полей значения.
     * @param {HTMLInputElement} field1 Поле, которое надо проверить.
     * @param {Array} args Массив с аргументами.
     * @returns {string|null} Строку с ошибкой или null, если ошибки не было.
     */
    fieldsCompatible(field1, args) {
        return field1.value !== document.querySelector(args[0]).value ? 'Поля не совпадают.' : null;
    },
};

/**
 * Класс для валидации формы.
 * @property {Array} rules Массив с правилами проверки инпутов.
 */
class Form {
    /**
     * Инициализирует форму,ставим обработчик события и правила проверки.
     */
    constructor() {
        this.formEl = null;
        this.rules = null;
        this.selectControlOptions = null;
    }

    /**
     * Инициализирует форму,ставим обработчик события и правила проверки.
     * @param {string} formName - имя формы
     * @param {string} submitButtonName - имя кнопки отправки
     * @param {string} rulesStorage - путь к хранилищу правил валидации полей
     * @param {string} selectControlOptionsStorage - путь к хранилищу наполнения селекшторов
     */
    init(formName, submitButtonName, rulesStorage, selectControlOptionsStorage) {
        // Находим форму и ставим обработчик события, при отправки формы вызываем метод validate.
        this.formEl = document.querySelector(formName);
        this.formEl.addEventListener(submitButtonName, e => this.formSubmit(e));

        // Ставим все правила для проверки формы.
        const request = new JSONRequest();
        request.getData(rulesStorage, (data) => this.rules = data);
        request.getData(selectControlOptionsStorage, (data) => {
            this.selectControlOptions = data;
            this.fillSelects();
        });
    }

    /**
     * Метод, который запускается перед отправкой формы.
     * @param {Event} e Событие отправки формы.
     */
    formSubmit(e) {
        // временно отключаю валидацию, чтобы не мешала
        if (!this.validate()) {
            e.preventDefault();
        }
    }

    /**
     * Валидирует форму.
     */
    validate() {
        // Изначально считаем что валидация успешна, если кто-то провалит, то поставим false.
        let isValid = true;
        // Перебираем все правила.
        for (let rule of this.rules) {
            // Получаем элемент, который проверяем.
            const inputEl = document.querySelector(rule.selector);
            // Перебираем все методы, по которым надо провалидировать поле.
            for (let method of rule.methods) {
                // Получаем ошибку после выполнения метода.
                const errMessage = validationMethods[method.name](inputEl, method.args);
                if (errMessage) {
                    // Если ошибка была, то меняем стили поля на не прошедшее валидацию.
                    this.setInvalidField(inputEl, errMessage);
                    // Ставим флаг что валидация провалилась в форме.
                    isValid = false;
                    // Больше не нужно проверять поле, если одну ошибку у поля уже получили.
                    break;
                } else {
                    // Если сообщения об ошибке не было, значит валидация пройдена.
                    this.setValidField(inputEl);
                }
            }
        }

        // Возвращаем общий результат формы, была пройдена валидация всеми или нет.
        return isValid;
    }

    /**
     * Устанавливает класс провала валидации инпуту и ставит сообщение о том, почему валидация провалена.
     * @param {Element} inputEl Элемент инпута, который провалил валидацию.
     * @param {string} message Сообщение об ошибке.
     */
    setInvalidField(inputEl, message) {
        // Ставим is-invalid класс и убираем is-valid у инпута.
        const cl = inputEl.classList;
        cl.remove('is-valid');
        cl.add('is-invalid');

        // Если не стояло уже сообщения об ошибке, то создаем и вставляем переданное сообщение как текст.
        let hintWrap = inputEl.parentNode.querySelector('.invalid-feedback');
        if (!hintWrap) {
            hintWrap = document.createElement('div');
            hintWrap.classList.add('invalid-feedback');
            inputEl.parentNode.appendChild(hintWrap);
        }

        hintWrap.textContent = message;
    }

    /**
     * Устанавливает класс прохождения валидации инпуту и убирает сообщение о провале валидации, если такое было.
     * @param {Element} inputEl
     */
    setValidField(inputEl) {
        // Ставим is-valid класс и убираем is-invalid у инпута.
        const cl = inputEl.classList;
        cl.remove('is-invalid');
        cl.add('is-valid');
    }

    /**
     * Устанавливает класс прохождения валидации инпуту и убирает сообщение о провале валидации, если такое было.
     */
    fillSelects() {
        for (let control of this.selectControlOptions) {
            const $el = $(control.id),
                content = control.content;
            switch (control.type) {
                case 'options':
                    for (let option of content) {
                        $el.append(`<option value="${option}">${option}</option>`);
                    }
                    break;
                case 'autocomplete':
                    $el.autocomplete({
                        minLength: 3,
                        source: content
                    });
                    break;
            }
        }
    }
}

class JSONRequest {
    getData(url, callback) {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: callback,
            error: function (e) {
                console.log(e);
            }
        });
    }
}

class Review {
    constructor() {
        this.initHandlers();
    }

    initHandlers() {
        $('#comments').on('click', '.vanish', (e) => {
            const commentID = $(e.target).attr('data-id');
            this.delete(commentID);
            e.preventDefault();
        });

        $('#comments').on('click', '.prove', (e) => {
            const commentID = $(e.target).attr('data-id');
            this.submit(commentID);
            e.preventDefault();
        });

        $('#submit').on('click', (e) => {
            this.add($('#user-name').val(), $('#comment-text').val());
            //this.change($('#user-name').val(), $('#comment-text').val(), $('#comment-id').val());
            e.preventDefault();
        });

    }

    /**
     *  Показать все отзывы Формирует html-код для вывода комментариев
     * | URL | review.list.json |
     * | Тип запроса | POST, asynchronous |
     * | Передаваемые данные | {} |
     * | Ожидаемый ответ | {comments: [{id_comment: 123,text: ‘Текст отзыва’}]} |
     * | Ответ в случае системной ошибки | {result : 0,error_message : “Сообщение об ошибке”} |
     */
    render() {
        const $div = $('#comments');
        $div.empty();
        $.get('http://localhost:3000/comments', {}, function (comments) {
            comments.forEach(function (item) {
                const $commentArea = $div.append(
                    $('<div />', {
                        class: 'form-row mt-4 w-100'
                    }));
                $commentArea.append(
                    $('<div />', {
                        class: `alert alert-${$.parseJSON(item.approved) ? 'success' : 'warning'} form-row mt-4 w-100`
                    })

                    .append(
                        $('<div />', {
                            text: 'User name: ' + item.user,
                            class: 'form-group col-md-7'
                        })
                    )
                    .append(
                        $('<div />', {
                            text: 'Comment ID: ' + item.id,
                            class: 'form-group col-md-5'
                        })
                    )
                    .append(
                        $('<div />', {
                            text: item.text,
                            class: 'form-group col-md-12 w-100'
                        })
                    ));

                if ($.parseJSON(item.approved)) {
                    $commentArea.append(
                        $('<div />', {
                            class: 'col-md-7'
                        }));
                } else {
                    $commentArea.append(
                            $('<button />', {
                                class: 'btn btn-outline-success col-md-5 prove',
                                type: 'button',
                                'data-id': item.id,
                                text: 'Prove'
                            }))
                        .append(
                            $('<div />', {
                                class: 'col-md-2'
                            })
                        );
                }
                $commentArea
                    .append(
                        $('<button />', {
                            class: 'btn btn-outline-danger col-md-5 vanish',
                            type: 'button',
                            'data-id': item.id,
                            text: 'Vanish'
                        })
                    );

            });
        }, 'json');
    }

    /**
     * Добавить отзыв
     * | URL | review.add.json |
     * | Тип запроса | POST, asynchronous |
     * | Передаваемые данные | {"id_user" : 123,“text” : “”} |
     * | Ожидаемый ответ | {result: 1, userMessage: "Ваш отзыв был передан на модерацию" } |
     * | Ответ в случае системной ошибки | {result : 0, error_message : “Сообщение об ошибке”} |
     */


    add(user, text) {
        const comment = {
            user: user,
            text: text,
            approved: false
        };
        $.ajax({
            type: 'POST',
            url: 'http://localhost:3000/comments',
            data: comment,
            success: () => this.render()
        });
    }

    /**
     * Изменить существующий отзыв
     * | URL | review.add.json |
     * | Тип запроса | POST, asynchronous |
     * | Передаваемые данные | {"id_user" : 123,“text” : “”} |
     * | Ожидаемый ответ | {result: 1, userMessage: "Ваш отзыв был передан на модерацию" } |
     * | Ответ в случае системной ошибки | {result : 0, error_message : “Сообщение об ошибке”} |
     */

    change(user, text, id) {
        const comment = {
            id: id,
            user: user,
            text: text,
            approved: false
        };

        if (id !== "") {
            // check if a comment with that ID appears - change comment, else add new
            const foundCommentURL = 'http://localhost:3000/comments/' + id;
            $.get(foundCommentURL, {}, (comments) => {
                $.ajax({
                    type: 'PATCH',
                    url: foundCommentURL,
                    data: comment,
                    success: () => this.render()
                });
            }, 'json').fail(() => {
                $.ajax({
                    type: 'POST',
                    url: 'http://localhost:3000/comments',
                    data: comment,
                    success: () => this.render()
                })
            });
        } else {
            this.add(user, text);
        }
    }

    /**
     *  Одобрить отзыв
     * | URL | review.submit.json |
     * | Тип запроса | POST, asynchronous |
     * | Передаваемые данные | {" id_comment" : 123} // ID отзыва, который одобряется |
     * | Ожидаемый ответ | {result: 1} |
     * | Ответ в случае системной ошибки | { result : 0, error_message : “Сообщение об ошибке” } |
     */
    submit(id) {
        $.ajax({
            type: 'PATCH',
            url: 'http://localhost:3000/comments/' + id,
            data: {
                approved: true
            },
            success: () => this.render()
        });
    }

    /**
     *  Удалить отзыв
     * | URL | review.delete.json |
     * | Тип запроса | POST, asynchronous |
     * | Передаваемые данные | {"id_comment" : 123} // ID отзыва, который удаляется |
     * | Ожидаемый ответ | {result: 1} |
     * | Ответ в случае системной ошибки | { result : 0,error_message : “Сообщение об ошибке”} |
     */
    delete(id) {
        $.ajax({
            type: 'DELETE',
            url: 'http://localhost:3000/comments/' + id,
            success: () => this.render()
        });
    }
}

$(document).ready(() => {
    // Инициализируем форму.
    const form = new Form();
    form.init('.my-form', 'submit', 'rules.json', 'selects_content.json');

    const review = new Review();
    review.render();
});