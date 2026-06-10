using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FxOs.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSeparation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SeparationRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AssignedPersonnelId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WasteTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProcessTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ResultGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ShelfId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PalletCount = table.Column<int>(type: "int", nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(18,3)", nullable: true),
                    CompletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeparationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeparationRequests_Definitions_ProcessTypeId",
                        column: x => x.ProcessTypeId,
                        principalTable: "Definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeparationRequests_Definitions_ResultGroupId",
                        column: x => x.ResultGroupId,
                        principalTable: "Definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeparationRequests_Definitions_WasteTypeId",
                        column: x => x.WasteTypeId,
                        principalTable: "Definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeparationRequests_Personnel_AssignedPersonnelId",
                        column: x => x.AssignedPersonnelId,
                        principalTable: "Personnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeparationRequests_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeparationRequests_Shelves_ShelfId",
                        column: x => x.ShelfId,
                        principalTable: "Shelves",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_AssignedPersonnelId",
                table: "SeparationRequests",
                column: "AssignedPersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_ProcessTypeId",
                table: "SeparationRequests",
                column: "ProcessTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_ProductId",
                table: "SeparationRequests",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_RequestNumber",
                table: "SeparationRequests",
                column: "RequestNumber");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_ResultGroupId",
                table: "SeparationRequests",
                column: "ResultGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_ShelfId",
                table: "SeparationRequests",
                column: "ShelfId");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_Status",
                table: "SeparationRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SeparationRequests_WasteTypeId",
                table: "SeparationRequests",
                column: "WasteTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SeparationRequests");
        }
    }
}
