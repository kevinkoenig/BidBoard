using System;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace BidBoard.Utility
{
    public interface IAuthorizationHelper 
    {
        bool IsLeadership(ClaimsPrincipal user);
        bool IsAdmin(ClaimsPrincipal user);
        bool IsUser(ClaimsPrincipal user);
        bool IsFinance(ClaimsPrincipal user);
        bool IsSales(ClaimsPrincipal user);
        bool IsSalesPlanner(ClaimsPrincipal user);
        bool IsInsideSales(ClaimsPrincipal user);
        bool IsPermissioned(ClaimsPrincipal user, string? role);
        string GetUserAdObjectId(ClaimsPrincipal user);
        bool HasGroupClaim(ClaimsPrincipal user, RolePermissions role);
        List<RolePermissions> GetRoleClaims(ClaimsPrincipal user);
        IDictionary<RolePermissions, string> Roles { get; }
    }

    public enum RolePermissions
    {
        Leadership = 1,
        Administrator = 2,
        Finance = 3,
        User = 4,
        Sales = 5,
        SalesPlanner = 6,
        InsideSales = 7
    }

    public class AuthorizationHelper : IAuthorizationHelper
    {
        private readonly Dictionary<RolePermissions, string> _roles;

        public AuthorizationHelper(IConfiguration configuration)
        {
            _roles = new Dictionary<RolePermissions, string>
            {
                {RolePermissions.Administrator, configuration.GetValue<string>("AzureSecurityGroup:AdminObjectId")},
                {RolePermissions.Leadership, configuration.GetValue<string>("AzureSecurityGroup:LeadershipObjectId")},
                {RolePermissions.Finance, configuration.GetValue<string>("AzureSecurityGroup:FinanceObjectId")},
                {RolePermissions.User, configuration.GetValue<string>("AzureSecurityGroup:UserObjectId") },
                {RolePermissions.Sales, configuration.GetValue<string>("AzureSecurityGroup:SalesObjectId") },
                {RolePermissions.SalesPlanner, configuration.GetValue<string>("AzureSecurityGroup:SalesPlannerObjectId") },
                {RolePermissions.InsideSales, configuration.GetValue<string>("AzureSecurityGroup:InsideSalesObjectId")}
            };
        }

        public IDictionary<RolePermissions, string> Roles => _roles;
        public bool IsLeadership(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.Leadership]);
        public bool IsAdmin(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.Administrator]);
        public bool IsFinance(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.Finance]);
        public bool IsUser(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.User]);
        public bool IsSales(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.Sales]);
        public bool IsSalesPlanner(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.SalesPlanner]);
        public bool IsInsideSales(ClaimsPrincipal user) => user.Claims.Any(c => c.Type == "groups" && c.Value == _roles[RolePermissions.InsideSales]);

        public string GetUserAdObjectId(ClaimsPrincipal user) => user?.Claims.FirstOrDefault(m => m.Type == "http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value ?? string.Empty;

        public bool HasGroupClaim(ClaimsPrincipal user, RolePermissions role) => user.HasClaim(m => m.Value == _roles[role]);

        public bool IsPermissioned(ClaimsPrincipal user, string? role)
        {
            var permissioned = true;
            if (!string.IsNullOrWhiteSpace(role))
            {
                if (Enum.TryParse<RolePermissions>(role, out var rolePermission))
                    permissioned = HasGroupClaim(user, rolePermission);
            }

            return permissioned;
        }

        public List<RolePermissions> GetRoleClaims(ClaimsPrincipal user)
        {
            var userRoles = new List<RolePermissions>();

            foreach (var role in _roles)
            {
                if (user.HasClaim(m => m.Value == role.Value))
                    userRoles.Add(role.Key);
            }

            return userRoles;
        }
    }
}
