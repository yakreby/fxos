using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FxOs.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOctabin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Octabins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OctabinNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    WasteTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ShelfId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Capacity = table.Column<decimal>(type: "decimal(18,3)", nullable: true),
                    NetWeight = table.Column<decimal>(type: "decimal(18,3)", nullable: true),
                    OpenedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DispatchedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
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
                    table.PrimaryKey("PK_Octabins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Octabins_Definitions_WasteTypeId",
                        column: x => x.WasteTypeId,
                        principalTable: "Definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Octabins_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Octabins_Shelves_ShelfId",
                        column: x => x.ShelfId,
                        principalTable: "Shelves",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Octabins_OctabinNumber",
                table: "Octabins",
                column: "OctabinNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Octabins_ProductId",
                table: "Octabins",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Octabins_ShelfId",
                table: "Octabins",
                column: "ShelfId");

            migrationBuilder.CreateIndex(
                name: "IX_Octabins_Status",
                table: "Octabins",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Octabins_WasteTypeId",
                table: "Octabins",
                column: "WasteTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Octabins");
        }
    }
}
