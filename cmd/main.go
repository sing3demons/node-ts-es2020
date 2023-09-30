package main

import (
	"context"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const uri = "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=my-replica-set"

func initDatabase() *mongo.Database {
	// Use the SetServerAPIOptions() method to set the Stable API version to 1
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)
	// Create a new client and connect to the server
	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		panic(err)
	}
	defer func() {
		if err = client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	db := client.Database("my-database")
	return db
}

type Post struct {
	ID      string `bson:"id" json:"id"`
	Title   string `json:"title" bson:"title,omitempty"`
	Content string `bson:"content,omitempty" json:"content"`
	Authors []User `bson:"authors,omitempty" json:"authors"`
}

type User struct {
	ID       string `bson:"id" json:"id"`
	Username string `bson:"username,omitempty" json:"username"`
	Email    string `bson:"email,omitempty" json:"email"`
}

func main() {
	db := initDatabase()
	postsCollection := db.Collection("posts")

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
		if err != nil {
			c.JSON(500, err)
			return
		}

		result := []Post{}

		pipeline := bson.A{
			bson.D{
				{Key: "$lookup",
					Value: bson.D{
						{Key: "from", Value: "users"},
						{Key: "localField", Value: "authors"},
						{Key: "foreignField", Value: "id"},
						{Key: "as", Value: "authors"},
					},
				},
			},
			bson.D{{Key: "$limit", Value: limit}},
		}
		cursor, err := postsCollection.Aggregate(context.Background(), pipeline)

		if err != nil {
			c.JSON(500, err)
			return
		}
		if err := cursor.All(context.Background(), &result); err != nil {
			c.JSON(500, err)
			return
		}
		c.JSON(200, result)
	})
	r.Run(":8080")
}
