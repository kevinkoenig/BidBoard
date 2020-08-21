using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace BidBoard.Utility
{
    public static class NavigationModel
    {
        private const string Underscore = "_";

        public static SmartNavigation Full => BuildNavigation();

        public static string GetPageName(string? href) => Path.GetFileNameWithoutExtension(href ?? string.Empty);

        private static SmartNavigation BuildNavigation()
        {
            var jsonText = File.ReadAllText("nav.json");
            var navigation = NavigationBuilder.FromJson(jsonText);
            var menu = FillProperties(navigation?.Lists);

            return new SmartNavigation(menu);
        }

        private static List<ListItem> FillProperties(IEnumerable<ListItem>? items)
        {
            var result = new List<ListItem>();

            if (items == null) 
                return result;

            foreach (var item in items)
            {
                item.Text ??= item.Title;
                item.Items = FillProperties(item.Items);
                
                var route = GetPageName(item.Href ?? string.Empty).Split(Underscore);
                item.Route = route.Length > 1 ? $"/{route.First()}/{string.Join(string.Empty, route.Skip(1))}" : item.Href;

                result.Add(item);
            }

            return result;
        }
    }
}
