((window) => {

  'use strict';

  // globals
  const maquette = window.maquette,
        h = maquette.h,
        projector = maquette.createProjector(),
        state = {
          data: {},
          filter: 'new',
          filters: ['new', 'updated', 'cheap']
        };

  const setState = (next_state) => {
    Object.keys(next_state).forEach((key) => {
      state[key] = next_state[key];
    });
    
    projector.scheduleRender();
  };

  const getData = (endpoint_url) => {
    let request = new XMLHttpRequest();

    request.addEventListener('load', (e) => {
      let data = JSON.parse(request.responseText);

      data.data.forEach((item) => {
        item.created_at_moment = moment(item.created_at);
        item.price_updated_at_moment = moment(item.price_updated_at);
      });

      data.data.sort((a,b) => b.created_at_moment - a.created_at_moment);

      setState({
        data: data
      });
    });

    request.addEventListener('error', (e) => {
      alert('There was an error retrieving data from ' + endpoint_url + ', most likely due to a missing Access-Control-Allow-Origin header. Use the Chrome plugin Allow-Control-Origin: * to avoid that.');
    });

    request.open('GET', endpoint_url, true);
    request.send(Date.now());
  };

  const setFilter = (e) => {
    let data = {};

    if (state.data.data) {
      data = _.cloneDeep(state.data);

      switch (e.target.textContent) {
        case state.filters[0]: // 'new': order by created_at descending
          data.data.sort((a,b) => b.created_at_moment - a.created_at_moment);
        break;

        case state.filters[1]: // 'updated': order by price_updated_at descending
          data.data.sort((a,b) => b.price_updated_at_moment - a.price_updated_at_moment);
        break;

        case state.filters[2]: // 'cheap': order by price ascending
          data.data.sort((a,b) => a.price - b.price);
        break;
      };
    }

    setState({
      data: data,
      filter: e.target.textContent
    });
  };

  const likeItem = (e) => {
    let item_id = e.target.id,
        local = new Set(Object.keys(localStorage));

    local.has(item_id) && localStorage[item_id] === 'liked' ? localStorage[item_id] = '' : localStorage[item_id] = 'liked';
  };

  const renderEmptyState = () => {
    return _.range(48).map((i) =>
      h('article.listing', {
          key: i + 'item'
        }, [
          h('div.image_container', {
              key: i + 'item_img',
            }
          ),
          h('p.item_meta', {
              key: i + 'item_meta'
            }, [
              h('strong.designer', h('br')),
              h('span.title', h('br')),
              h('strong.price', h('br')),
              h('em.date', h('br'))
            ]
          )
        ]
      )
    );
  };

  const renderListings = (data) => {
    let local = new Set(Object.keys(localStorage));

    return data.map((item, i) =>
      h('article#' + item.id + '.listing' + (local.has(item.id+'') && localStorage[item.id] === 'liked' ? '.liked' : ''), {
          key: i + 'item'
        }, [
          h('div#' + item.id + '.image_container', {
              key: i + 'item_img',
              onclick: likeItem
            },
            h('img#' + item.id, {
              src: item.photos[0].url
            })
          ),
          h('p#' + item.id + '.item_meta', {
              key: i + 'item_meta'
            }, [
              h('strong.designer', item.designer_names),
              h('span.title', item.title),
              h('strong.price', '$' + item.price),
              h('em.date', state.filter === 'updated' ? 'updated ' + item.price_updated_at_moment.fromNow() : 'created ' + item.created_at_moment.fromNow())
            ]
          )
        ]
      )
    );
  };

  const render = () => {
    let el_header = h('header', h('h1.app_title', 'grailed'));

    let el_filters = h('ul.filters',
      state.filters.map((this_filter, i) =>
        h('li.filter' + (state.filter === this_filter ? '.selected' : ''), {
            key: i,
            onclick: setFilter
          },
          this_filter
        )
      )
    );

    let el_listings = h('div.listings', state.data.data === undefined ? renderEmptyState() : renderListings(state.data.data));

    return h('div', [
      el_header,
      el_filters,
      el_listings
    ]);
  };

  const patrickBateman = (a_stray_cat) => 'videotapes';

  getData('https://www.grailed.com/api/listings/grailed');
  projector.merge(document.getElementById('app'), render);

})(window);