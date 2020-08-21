using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BidBoard.Models
{
    
    public class BidBoardContext : IdentityDbContext<BidBoardUser>  
    {
        private readonly string _connectionString;

        public BidBoardContext(IConfiguration config, DbContextOptions<BidBoardContext> options) : base(options)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        public BidBoardContext(string connectionString)
        {
            _connectionString = connectionString;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Opportunity>()
                .HasIndex(b => b.ZipCode)
                .IsUnique(false);
            modelBuilder.Entity<Opportunity>()
                .HasIndex(b => b.StateProvince)
                .IsUnique(false);
            modelBuilder.Entity<Opportunity>()
                .HasIndex(b => b.ProjectType)
                .IsUnique(false);
            
            base.OnModelCreating(modelBuilder);
        }

        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            options.UseSqlServer(_connectionString, b => b.MigrationsAssembly("BidBoard"));
            base.OnConfiguring(options);
        }

        public DbSet<Opportunity> Opportunities => Set<Opportunity>();
        public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
        public DbSet<UploadedFile> UploadedFiles => Set<UploadedFile>();
        public DbSet<UserOpportunityData> UserOpportunityData => Set<UserOpportunityData>();
    }
}