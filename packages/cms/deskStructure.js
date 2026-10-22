// ICONS
import {MdArticle, MdDescription, MdHome, MdList, MdPublic, MdSettings} from 'react-icons/md'

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
        .title('Post index')
        .icon(MdList)
        .child(
          S.editor()
            .id('postIndex')
            .title('Post index')
            .schemaType('postIndex')
            .documentId('postIndex'),
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
      // One entry per micro-site, each opening to the site document (its
      // front page) and the list of its pages. A page created from that list
      // starts with its `site` set (the template in sanity.config.ts). Sites
      // themselves are created by the scaffold script, so the list has no
      // "create" button.
      S.listItem()
        .title('Micro-sites')
        .icon(MdPublic)
        .child(
          S.documentTypeList('microSite')
            .title('Micro-sites')
            .initialValueTemplates([])
            .child((siteId) =>
              S.list()
                .title('Micro-site')
                .items([
                  S.listItem()
                    .title('Site')
                    .icon(MdSettings)
                    .child(S.document().schemaType('microSite').documentId(siteId)),
                  S.listItem()
                    .title('Pages')
                    .icon(MdDescription)
                    .child(
                      S.documentList()
                        .title('Pages')
                        .schemaType('microSitePage')
                        .apiVersion('2026-01-01')
                        .filter('_type == "microSitePage" && site._ref == $siteId')
                        .params({siteId})
                        .initialValueTemplates([
                          S.initialValueTemplateItem('microSitePage-for-site', {siteId}),
                        ]),
                    ),
                ]),
            ),
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
