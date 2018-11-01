// Strings for AJAX Request
var ajaxPartOne = 'https://m3tcasc1v1.execute-api.us-west-2.amazonaws.com/tumble_api/'
var ajaxPartTwo = '.tumblr.com/posts/'
var postType = ''//'photo';
var tagKey = 'tag';
var offsetKey = 'offset';
var reblogPrefix = 'https://www.tumblr.com/reblog/'

// Request Variables
var tumblrName = ''; 
var tagQuery = '';

// Elements
var tumblrInput = document.getElementById('tumblr-name-input');
var tagInput = document.getElementById('tumblr-tag-input');
var photosDiv = document.getElementById('photos');
var imageViewerElement = document.getElementById('image-viewer');
var imageElement = document.getElementById('image');
var tagsElement = document.getElementById('tags');
var postLink = document.getElementById('post-link');
var reblogLink = document.getElementById('reblog-link');
var loadMoreButton = document.getElementById('load-more-button');
var currentPostsSpan = document.getElementById('current-posts');
var totalPostsSpan = document.getElementById('total-posts');
var postCountDiv = document.getElementById('post-count');

// Toggleable Classes
var hideClass = 'hide'

// Variables for Pagination
var postOffset = 0;
var totalPosts = 0;
var photosLoaded = 0;
var noMorePosts = false;

//Add Event Listeners
document.addEventListener("keydown", checkForRightOrLeftArrow);
document.addEventListener('paste', pasteAndLoad());

function pasteAndLoad() {
    return function(event) {
        var pasteString = event.clipboardData.getData("text");
        event.preventDefault();
        
        // Need to take more inputs, for now, just the tumblr name
        tumblrInput.value = pasteString;
        loadImages();
    }
}

function checkForRightOrLeftArrow(event) {
   // debugger;
    // If image viewer is closed, do nothing
    if (imageViewerElement.classList.contains('hide')) {
        return;
    }

    // Right Arrow Pressed
    if(event.keyCode === 39) {
        nextImage();
    }
    // Left Arrow Pressed
    if(event.keyCode === 37) {
        prevImage();
    }
}

function nextImage() {
    var currentId = imageElement.dataset.id;
    var nextId = parseInt(currentId) + 1;

    var nextPhoto = document.getElementById(nextId);

    if(nextPhoto) {
        nextPhoto.click();
    }
}

function prevImage() {
    var currentId = imageElement.dataset.id;
    var prevId = parseInt(currentId) - 1;

    var prevPhoto = document.getElementById(prevId);

    if(prevPhoto) {
        prevPhoto.click();
    }
}

function loadImages() {
    // If they update the Tumblr or Tags, clear everything out
    if (tumblrName != tumblrInput.value || tagQuery != tagInput.value) {
        clearEverything();
        closeImage();
    }

    if(noMorePosts) {
        reachedTheEnd();
        return;
    }

    tumblrName = tumblrInput.value;
    tagQuery = tagInput.value;

    document.title = tumblrName + ' - tumble';

    ajaxCall();
}

function loadMoreImages() {
    if(noMorePosts) {
        reachedTheEnd();
        return;
    }

    if(!tumblrName) {
        return;
    }

    ajaxCall();
}

function ajaxCall() {
    var xhr = new XMLHttpRequest();

    var request = generateRequestString(tumblrName, postOffset, tagQuery);
    loadMoreButton.classList.add(hideClass);

    xhr.open('GET', request);
    xhr.onload = function () {
        if (xhr.status === 200) {
            handleSuccess(JSON.parse(this.response));
        }
        else {
            handleError(JSON.parse(this.response));
        }
    };
    xhr.send();
}

function generateRequestString(tumblrName, currentOffset, tag) {
    var requestString = ajaxPartOne + tumblrName + ajaxPartTwo + postType;

    // Add Offset
    requestString += '?' + offsetKey + '=' + currentOffset;

    // Add Tags if they exist
    if(tagQuery) {
        requestString += '&' + tagKey + '=' + tagQuery;
    }

    return requestString;
}

function handleSuccess(data) {
    console.log(data);
    totalPosts = data.response.total_posts;

    if(data.response.posts.length > 0) {
        postOffset += data.response.posts.length;
        
        loadMoreButton.classList.remove(hideClass);
        postCountDiv.classList.remove(hideClass);
        addImages(data.response.posts);
        updatePostCount();
    } else {
        updatePostCount();
        reachedTheEnd();
    }
}

function handleError(data) {
    alert(data.errors[0].title + ' - ' + data.errors[0].detail);
}

function clearEverything() {
    postOffset = 0;
    photosDiv.innerHTML = '';
    noMorePosts = false;
}

function reachedTheEnd() {
    noMorePosts = true;
    loadMoreButton.classList.add(hideClass);
    alert('Thats All Folks - Nothing left to see');
}

function addImages(posts) {
    for (var i = 0; i < posts.length; i++) {
        if(posts[i].type == "photo") {
            var urls = posts[i].photos;


            for(var j = 0; j < urls.length; j++) {
                var newWrapperElement = document.createElement('div');
                newWrapperElement.classList.add('photo-wrapper');

                var newElement = document.createElement('img');

                newElement.src = urls[j].original_size.url;
                newElement.dataset.url = posts[i].post_url;
                newElement.dataset.id = posts[i].id;
                newElement.dataset.caption = posts[i].caption;
                newElement.dataset.reblogKey = posts[i].reblog_key;
                newElement.dataset.tags = posts[i].tags;
                newElement.dataset.noteCount = posts[i].note_count;
                newElement.classList.add('photo');
                if(urls.length > 1) {
                    // Add the count
                    var photoSetCountElement = document.createElement('div')
                    photoSetCountElement.classList.add('photoset-count');
                    photoSetCountElement.innerText = j + 1;
                    newWrapperElement.appendChild(photoSetCountElement);

                    if(j > 0) {
                        photoSetCountElement.classList.add('not-first');
                    }

                    // try and make it look pretty
                    if(j === 0) {
                        newWrapperElement.classList.add('first');
                    } else if (j === urls.length - 1) {
                        newWrapperElement.classList.add('last');
                    } else {
                        newWrapperElement.classList.add('middle');

                    }
                }
                newElement.onclick = zoomImage();
                newWrapperElement.appendChild(newElement);

                photosDiv.appendChild(newWrapperElement)

                newElement.id = photosLoaded; 
                photosLoaded++;
            }
        }
        if(posts[i].type == 'text') {
            var newWrapperElement = htmlToElement('<div class="photo-wrapper text">' + posts[i].body + '</div>');

            photosDiv.appendChild(newWrapperElement)

            //newElement.id = photosLoaded; 
            //photosLoaded++;
        }
    }
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function zoomImage() {
    return function(event) {
        postLink.href = event.target.dataset.url;
        reblogLink.href =  reblogPrefix + event.target.dataset.id + '/' + event.target.dataset.reblogKey;
        imageElement.src = event.target.src;
        imageElement.dataset.id = event.target.id;

        updateTags(event.target.dataset.tags);

        imageViewerElement.classList.remove(hideClass);
    }
}

function closeImage() {
    imageViewerElement.classList.add(hideClass);
}

// View Functions
function updatePostCount() {
    totalPostsSpan.innerText = totalPosts;
    currentPostsSpan.innerText = postOffset;
}

function updateTags(tags) {
    if(!tags) {
        tagsElement.empty();
        return;
    }

    tagsElement.innerHTML = '';

    tags = tags.split(',')

    for(var i = 0; i < tags.length; i++) {
        var tagLink = document.createElement('a');

        tagLink.innerText = tags[i];
        tagLink.onclick = loadTag();
        
        tagsElement.appendChild(tagLink);
    }
}

function loadTag() {
    return function(event) {
        event.stopPropagation();
        tagInput.value = event.target.innerText;
        loadImages();
    }
}