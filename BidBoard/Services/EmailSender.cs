using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading.Tasks;

namespace BidBoard.Services
{
    public class AuthMessageSenderOptions
    {
        public string? SendGridUser { get; set; }
        public string? SendGridKey { get; set; }
    }    
    
    public class EmailSender : IEmailSender
    {
        public EmailSender(IOptions<AuthMessageSenderOptions> optionsAccessor)
        {
            Options = optionsAccessor.Value;
        }

        private AuthMessageSenderOptions Options { get; } //set only via Secret Manager

        public Task SendEmailAsync(string email, string subject, string message)
        {
            return Execute(Options.SendGridKey ?? string.Empty, subject, message, email);
        }

        private Task Execute(string apiKey, string subject, string message, string email)
        {
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                var client = new SendGridClient(apiKey);
                var msg = new SendGridMessage
                {
                    From = new EmailAddress("kevin.koenig@aurigo.com", Options.SendGridUser),
                    Subject = subject,
                    PlainTextContent = message,
                    HtmlContent = message
                };
                msg.AddTo(new EmailAddress(email));
                msg.SetClickTracking(false, false);

                return client.SendEmailAsync(msg);
            }

            return Task.FromResult(0);
        }
    }
}