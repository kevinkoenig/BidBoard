using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;

// ReSharper disable ClassNeverInstantiated.Global
// ReSharper disable UnusedAutoPropertyAccessor.Global : Justification: instantiated by newtonsoft
// ReSharper disable MemberCanBePrivate.Global
// ReSharper disable AutoPropertyCanBeMadeGetOnly.Global

namespace BidBoard.Utility
{
    public class ADUserResponse
    {
        public ADUserResponse()
        {
            Roles = new List<RolePermissions>();
        }
        public string? Id { get; set; }
        public string? DisplayName { get; set; }
        public string? GivenName { get; set; }
        public string? JobTitle { get; set; }
        public string? Mail { get; set; }
        public string? MobilePhone { get; set; }
        public string? Surname { get; set; }
        public string? UserPrincipalName { get; set; }
        public List<RolePermissions> Roles { get; set; }
    }

    public class ADGroupResponse
    {
        public List<ADUserResponse>? Value { get; set; }
    }
    
    public interface IActiveDirectoryClient
    {
        Task<byte[]?> GetUserPictureAsync(ClaimsPrincipal user);
        Task<List<ADUserResponse>?> GetUsersForGroupAsync(RolePermissions role);
        Task<ADUserResponse?> GetManagerForUserAsync(string? id);
    }

    public class ActiveDirectoryClient : IActiveDirectoryClient
    {
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;
        private readonly IAuthorizationHelper _authorizationHelper;
        private readonly int _bearerCacheTimeout;
        private readonly int _imageCacheTimeout;
        private readonly HttpClient _client;

        public ActiveDirectoryClient(HttpClient client, IConfiguration config, IMemoryCache cache, IAuthorizationHelper authorizationHelper)
        {
            _config = config;
            _cache = cache;
            _authorizationHelper = authorizationHelper;
            _bearerCacheTimeout = _config.GetValue<int>("AzureAd:BearerCacheTimeOut");
            _imageCacheTimeout = _config.GetValue<int>("AzureAd:ImageCacheTimeOut");
            _client = client;
        }

        private async Task GetAzureAdAccessToken()
        {
            var cacheEntry = await _cache.GetOrCreateAsync<string>("azuread-bearer-token", async entry =>
            {
                entry.AbsoluteExpiration = DateTimeOffset.Now.AddMinutes(_bearerCacheTimeout);

                using (var access = new HttpClient { BaseAddress = new Uri(_config.GetValue<string>("AzureAd:Instance")) })
                {

                    var tenantId = _config.GetValue<string>("AzureAd:TenantId");
                    var clientId = _config.GetValue<string>("AzureAd:ClientId");
                    var clientSecret = _config.GetValue<string>("AzureAd:ClientSecret");

                    var content = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("client_id", $"{clientId}"),
                    new KeyValuePair<string, string>("scope", "https://graph.microsoft.com/.default"),
                    new KeyValuePair<string, string>("client_secret", clientSecret),
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                };

                    try
                    {
                        var response = await access.PostAsync($"{tenantId}/oauth2/v2.0/token", new FormUrlEncodedContent(content)).ConfigureAwait(false);
                        var accessInfo = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                        dynamic? accessData = null;
                        if (accessInfo != null)
                            accessData = JsonConvert.DeserializeObject(accessInfo);
                        
                        var authToken = accessData?.access_token ?? string.Empty;
                        return authToken;
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e);
                    }
                }

                return string.Empty;
            }).ConfigureAwait(false);

            if (!_client.DefaultRequestHeaders.Contains("Authorization"))
                _client.DefaultRequestHeaders.Add("Authorization", "Bearer " + cacheEntry);
        }

        private string GetCacheKey(string objectId)
        {
            return "azuread-user-image-" + objectId;
        }

        public async Task<List<ADUserResponse>?> GetUsersForGroupAsync(RolePermissions role)
        {
            await GetAzureAdAccessToken().ConfigureAwait(false);

            if (_authorizationHelper.Roles.ContainsKey(role))
            {
                var groupObjectId = _authorizationHelper.Roles[role];
                var groupResponse = await _client.GetAsync($"v1.0/groups/{groupObjectId}/members");
                if (groupResponse.StatusCode != System.Net.HttpStatusCode.NotFound)
                {
                    var groupData = await groupResponse.Content.ReadAsStringAsync().ConfigureAwait(false);
                    var usersForGroup = JsonConvert.DeserializeObject<ADGroupResponse>(groupData);
                    return usersForGroup?.Value;
                }
            }

            return null;
        }

        public async Task<ADUserResponse?> GetManagerForUserAsync(string? id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return null;
            
            await GetAzureAdAccessToken().ConfigureAwait(false);
            var managerResponse = await _client.GetAsync($"v1.0/users/{id}/manager");
            if (managerResponse.StatusCode != System.Net.HttpStatusCode.OK) 
                return null;
            
            var managerData = await managerResponse.Content.ReadAsStringAsync().ConfigureAwait(false);
            var manager = JsonConvert.DeserializeObject<ADUserResponse>(managerData);
            return manager;
        }

        public async Task<byte[]?> GetUserPictureAsync(ClaimsPrincipal user)
        {
            await GetAzureAdAccessToken().ConfigureAwait(false);

            var userObjectId = user.Claims.FirstOrDefault(m => m.Type == "http://schemas.microsoft.com/identity/claims/objectidentifier");
            if (userObjectId != null)
            {
                var objectId = userObjectId.Value;
                var cacheEntryName = GetCacheKey(objectId);
                var photoCacheEntry = await _cache.GetOrCreateAsync(cacheEntryName, async entry =>
                {
                    entry.AbsoluteExpiration = DateTimeOffset.Now.AddMinutes(_imageCacheTimeout);
                    var photoResponse = await _client.GetAsync($"v1.0/users/{objectId}/photos/48x48/$value");
                    if (photoResponse.StatusCode == System.Net.HttpStatusCode.OK)
                    {
                        var photoData = await photoResponse.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
                        return photoData;
                    }
                    return null;

                }).ConfigureAwait(false);

                return photoCacheEntry;
            }

            return null;
        }
    }
}
