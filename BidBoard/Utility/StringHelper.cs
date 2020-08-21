using System.Text.RegularExpressions;

namespace BidBoard.Utility
{
    public static class StringHelper
    {
        public static string CamelCaseToSpacedString(this string input)
        {
            return Regex.Replace(input, "(\\B[A-Z])", " $1");
        }
    }
}
