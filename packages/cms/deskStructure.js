// ICONS
import {MdArticle, MdHome, MdSettings} from 'react-icons/md'

export default (S) =>
  S.list()
    .title('Moving Castles')
    .items([
      S.listItem()
        .title('Frontpage')
        .icon(MdHome)
        .child(
          S.editor()
            .id('frontpage')
            .title('Frontpage')
            .schemaType('frontpage')
            .documentId('frontpage'),
        ),
      S.listItem()
        .title('Posts')
        .icon(MdArticle)
        .child(
          S.documentList()
            .title('Posts')
            .showIcons(true)
            .filter('_type == $type')
            .params({type: 'post'}),
        ),
      S.listItem()
        .title('Site Settings')
        .icon(MdSettings)
        .child(
          S.editor()
            .id('siteSettings')
            .title('Site Settings')
            .schemaType('siteSettings')
            .documentId('siteSettings'),
        ),
    ])
